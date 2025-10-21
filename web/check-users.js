const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log('Existing users:', users);
    
    // Check if our test user exists
    const testUser = await prisma.user.findUnique({
      where: { email: 'tillman60@ethereal.email' }
    });
    
    if (testUser) {
      console.log('Test user found:', testUser);
    } else {
      console.log('Test user not found. Creating test user...');
      
      // Create a test user
      const newUser = await prisma.user.create({
        data: {
          email: 'tillman60@ethereal.email',
          name: 'Tillman Carter',
          password: '$2a$12$example_hashed_password' // This is just a placeholder
        }
      });
      
      console.log('Test user created:', newUser);
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();