import bcrypt from "bcrypt";

bcrypt.hash("admin123", 10).then(hash => {
  console.log("Hashed Password:", hash);
});
