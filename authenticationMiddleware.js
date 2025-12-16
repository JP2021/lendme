const auth = require("./auth");
const db = require("./db");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

module.exports = (passport) => {

    passport.serializeUser((user, done) => {
        done(null, user._id);
    })

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.findUser(id);
            done(null, user);
        } catch (err) {
            done(err, false);
        }
    })

    passport.use(new LocalStrategy({
        usernameField: "name",
        passwordField: "password"
    },
        async (username, password, done) => {
            try {
                const user = await auth.findUserByName(username);
                if (!user) return done(null, false);

                if (!bcrypt.compareSync(password, user.password))
                    return done(null, false);
                else
                    return done(null, user);
            }
            catch (err) {
                return done(err, false);
            }
        }
    ))
}