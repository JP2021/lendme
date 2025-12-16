const { connect } = require ("./db");

async function findUserByName(name){
    const connection = await connect ();
    return connection
        .collection("users")
        .findOne({name});
}

async function findUserByEmail(email){
    const connection = await connect ();
    return connection
        .collection("users")
        .findOne({email});
}
function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let password = "";

    for (let i = 0; i < 10; i++)
        password += chars.charAt(Math.random() * 61);

    return password;
}


module.exports = {
    
    findUserByName,
    findUserByEmail,
    generatePassword
}