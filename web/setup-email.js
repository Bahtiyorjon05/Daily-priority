const nodemailer = require('nodemailer');

async function setupEtherealEmail() {
  try {
    // Generate Ethereal.email account
    const account = await nodemailer.createTestAccount();
    
    console.log('Ethereal.email account created successfully!');
    console.log('=====================================');
    console.log('Add these to your .env.local file:');
    console.log('=====================================');
    console.log(`ETHEREAL_USER=${account.user}`);
    console.log(`ETHEREAL_PASS=${account.pass}`);
    console.log('=====================================');
    console.log('Preview URL:', nodemailer.getTestMessageUrl({
      messageId: 'test-message-id'
    }));
    
    // Also create or update .env.local with these values
    const fs = require('fs');
    const path = require('path');
    
    const envLocalPath = path.join(__dirname, '.env.local');
    const envExamplePath = path.join(__dirname, '.env.example');
    
    let envContent = '';
    
    // Check if .env.local exists
    if (fs.existsSync(envLocalPath)) {
      envContent = fs.readFileSync(envLocalPath, 'utf8');
    } else if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }
    
    // Update or add Ethereal.email credentials
    const etherealLines = [
      `ETHEREAL_USER=${account.user}`,
      `ETHEREAL_PASS=${account.pass}`
    ];
    
    // Remove existing Ethereal lines
    const lines = envContent.split('\n').filter(line => 
      !line.startsWith('ETHEREAL_USER=') && 
      !line.startsWith('ETHEREAL_PASS=')
    );
    
    // Add new Ethereal lines before the production section
    const productionIndex = lines.findIndex(line => 
      line.includes('For production') || line.includes('# Gmail')
    );
    
    if (productionIndex !== -1) {
      lines.splice(productionIndex, 0, '', '# For development only (Ethereal.email)', ...etherealLines, '');
    } else {
      lines.push('', '# For development only (Ethereal.email)', ...etherealLines, '');
    }
    
    // Write back to .env.local
    fs.writeFileSync(envLocalPath, lines.join('\n'));
    
    console.log('\n.env.local file updated successfully!');
    console.log('You can now test the forgot password functionality.');
    
  } catch (error) {
    console.error('Error setting up Ethereal.email:', error);
  }
}

// Run the setup
setupEtherealEmail();