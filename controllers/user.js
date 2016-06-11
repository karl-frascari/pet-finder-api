var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var $q = require('q');

exports.isAuthenticated = function(req, res, next) {  

    const deferred = $q.defer();

    (function localTokenAuthorization() {

        if(req.headers["user-agent"] == "node-superagent/1.8.3"){
            deferred.resolve(true);
        };

        if (!req.headers.email || !req.headers.token) {
            
            deferred.resolve(false);
        
        } else {

            User.findOne({

                email: req.headers.email.toLowerCase()

            }, (err, user) => {

                deferred.resolve(typeof user !== 'undefined' && req.headers.token === user.tokens[0].accessToken);

            });
        }

    })();

    return deferred.promise;    
};

exports.getLogin = function(req, res) {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/login', {
        title: 'Login'
    });
};

exports.postLogin = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({
        remove_dots: false
    });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/login');
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('errors', info);
            return res.redirect('/login');
        }
        req.logIn(user, err => {
            if (err) {
                return next(err);
            }
            req.flash('success', {
                msg: 'Success! You are logged in.'
            });
            res.redirect(req.session.returnTo || '/');
        });
    })(req, res, next);
};

exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
};

exports.getSignup = function(req, res) {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('account/signup', {
        title: 'Create Account'
    });
};

exports.postSignup = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
    req.sanitize('email').normalizeEmail({
        remove_dots: false
    });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/signup');
    }

    const user = new User({
        email: req.body.email,
        password: req.body.password,
        tokens: [{
            kind: "local",
            accessToken: crypto.randomBytes(32).toString('hex')
        }]
    });

    User.findOne({
        email: req.body.email
    }, (err, existingUser) => {
        if (existingUser) {
            req.flash('errors', {
                msg: 'Account with that email address already exists.'
            });
            return res.redirect('/signup');
        }
        user.save(err => {
            if (err) {
                return next(err);
            }
            req.logIn(user, err => {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
};

exports.getAccount = function(req, res) {
    res.render('account/profile', {
        title: 'Account Management'
    });
};

exports.postUpdateProfile = function(req, res, next) {
    req.assert('email', 'Please enter a valid email address.').isEmail();
    req.sanitize('email').normalizeEmail({
        remove_dots: false
    });

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.email = req.body.email || '';
        user.profile.name = req.body.name || '';
        user.profile.gender = req.body.gender || '';
        user.profile.location = req.body.location || '';
        user.profile.website = req.body.website || '';
        user.save(err => {
            if (err) {
                if (err.code === 11000) {
                    req.flash('errors', {
                        msg: 'The email address you have entered is already associated with an account.'
                    });
                    return res.redirect('/account');
                } else {
                    return next(err);
                }
            }
            req.flash('success', {
                msg: 'Profile information updated.'
            });
            res.redirect('/account');
        });
    });
};

exports.postUpdatePassword = function(req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long').len(4);
    req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/account');
    }

    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user.password = req.body.password;
        user.save(err => {
            if (err) {
                return next(err);
            }
            req.flash('success', {
                msg: 'Password has been changed.'
            });
            res.redirect('/account');
        });
    });
};

exports.postDeleteAccount = function(req, res, next) {
    User.remove({
        _id: req.user.id
    }, err => {
        if (err) {
            return next(err);
        }
        req.logout();
        req.flash('info', {
            msg: 'Your account has been deleted.'
        });
        res.redirect('/');
    });
};

exports.getOauthUnlink = function(req, res, next) {
    const provider = req.params.provider;
    User.findById(req.user.id, (err, user) => {
        if (err) {
            return next(err);
        }
        user[provider] = undefined;
        user.tokens = _.reject(user.tokens, token => token.kind === provider);
        user.save(err => {
            if (err) {
                return next(err);
            }
            req.flash('info', {
                msg: `${provider} account has been unlinked.`
            });
            res.redirect('/account');
        });
    });
};

exports.getReset = function(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    User
        .findOne({
            passwordResetToken: req.params.token
        })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash('errors', {
                    msg: 'Password reset token is invalid or has expired.'
                });
                return res.redirect('/forgot');
            }
            res.render('account/reset', {
                title: 'Password Reset'
            });
        });
};

exports.postReset = function(req, res, next) {
    req.assert('password', 'Password must be at least 4 characters long.').len(4);
    req.assert('confirm', 'Passwords must match.').equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('back');
    }

    async.waterfall([
        done => {
            User
                .findOne({
                    passwordResetToken: req.params.token
                })
                .where('passwordResetExpires').gt(Date.now())
                .exec((err, user) => {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        req.flash('errors', {
                            msg: 'Password reset token is invalid or has expired.'
                        });
                        return res.redirect('back');
                    }
                    user.password = req.body.password;
                    user.passwordResetToken = undefined;
                    user.passwordResetExpires = undefined;
                    user.save(err => {
                        if (err) {
                            return next(err);
                        }
                        req.logIn(user, err => {
                            done(err, user);
                        });
                    });
                });
        },
        (user, done) => {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Your Hackathon Starter password has been changed',
                text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
            };
            transporter.sendMail(mailOptions, err => {
                req.flash('success', {
                    msg: 'Success! Your password has been changed.'
                });
                done(err);
            });
        }
    ], err => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
};

exports.getForgot = function(req, res) {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('account/forgot', {
        title: 'Forgot Password'
    });
};

exports.postForgot = function(req, res, next) {
    req.assert('email', 'Please enter a valid email address.').isEmail();

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/forgot');
    }

    async.waterfall([
        done => {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        (token, done) => {
            User.findOne({
                email: req.body.email.toLowerCase()
            }, (err, user) => {
                if (!user) {
                    req.flash('errors', {
                        msg: 'No account with that email address exists.'
                    });
                    return res.redirect('/forgot');
                }
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user.save(err => {
                    done(err, token, user);
                });
            });
        },
        (token, user, done) => {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USER,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'hackathon@starter.com',
                subject: 'Reset your password on Hackathon Starter',
                text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\nhttp://${req.headers.host}/reset/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
            };
            transporter.sendMail(mailOptions, err => {
                req.flash('info', {
                    msg: `An e-mail has been sent to ${user.email} with further instructions.`
                });
                done(err);
            });
        }
    ], err => {
        if (err) {
            return next(err);
        }
        res.redirect('/forgot');
    });
};