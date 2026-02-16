const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@saves.com';
    const adminPassword = 'saves123@A';
    const adminName = 'Super Admin';

    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log('Admin account created successfully');
    } else {
      // Optional: Update password/role if they don't match, or just log existence
      // For "always be admin", we might want to ensure role is admin
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log('Existing user updated to admin role');
      }
    }
  } catch (err) {
    console.error(`Error seeding admin: ${err.message}`);
  }
};

module.exports = seedAdmin;
