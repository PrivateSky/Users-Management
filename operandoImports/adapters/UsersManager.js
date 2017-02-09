
var core = require("swarmcore");
core.createAdapter("UsersManager");

var apersistence = require('apersistence');
const crypto = require('crypto');
var container = require("safebox").container;
var flow = require("callflow");
var uuid = require('uuid');
var passwordMinLength = 4;

var saveCallbackFn = function (err, obj) {
    if (err) {
        console.log(err);
    }
};

/*
 Model de date pentru organizatie
 */

apersistence.registerModel("Organisation", "Redis", {
    ctor: function () {
    },
    organisationId: {
        type: "string",
        pk: true,
        index: true
    },
    displayName: {
        type: "string"
    },
    agent: {
        /* numele de grup al agentului */
        type: "string"
    }
}, function (err, model) {
    if (err) {
        console.log(err);
    }
});

/*
 Default User model
 */

apersistence.registerModel("DefaultUser", "Redis", {
    userId: {
        type: "string",
        pk: true,
        index: true
    },
    organisationId: {
        type: "string",
        index: true
    },
    password: {
        type: "string"
    },

    email: {
        type: "string",
        index:true
    },
    is_active: {
        type: "boolean",
        default:true
    },
    zones:{
        type:"string"
    },
    salt:{
        type:"string"
    },
    activationCode:{
        type: "string",
        index:true,
        default:"0"
    }
}, function (err, model) {
    if (err) {
        console.log(err);
    }
});

/*
 Creeaza un utilizator
 */

createUser = function (userData, callback) {
    redisPersistence.filter("DefaultUser",{"email":userData.email},function(err,result){
        if(err){
            callback(new Error("Could not filter users by email"))
        }else if(result.length>0){
            callback(new Error("User with email "+userData.email+" already exists"));
        }else{
            if(!userData.userId){
                userData.userId = uuid.v1().split("-").join("");
            }
            redisPersistence.lookup("DefaultUser", userData.userId, function(err,user){
                if(err){
                    callback(new Error("Could not retrieve user by id"))
                }else if(!redisPersistence.isFresh(user)){
                    callback(new Error("User with id "+userData.userId+" already exists"));
                }else{
                    userData.salt = crypto.randomBytes(48).toString('base64');
                    user.salt = userData.salt;
                    hashThisPassword(userData.password,userData.salt,function(err,hashedPassword){
                        userData.password = hashedPassword;
                        redisPersistence.externalUpdate(user,userData);
                        redisPersistence.save(user,function(err,newUser){
                            if(err){
                                callback(new Error("Could not create user"))
                            }else{
                                delete user['password'];
                                callback(undefined,user);
                            }
                        })
                    });
                }
            });
        }
    });
};

/*
 Filtreaza utilizatorii
 */

filterUsers = function(conditions,callback){
    redisPersistence.filter("DefaultUser",conditions,function(err,result){
        /*
        if(result.length>0){
            result = result.map(function(user){
                delete user.password;
                delete user.salt;
                delete user.__meta.savedValues.password;
                delete user.__meta.savedValues.salt;
                return user;
            })
        }*/
        callback(err,result)
    });
};

/*
 Sterge un utilizator
 */

deleteUser = function (userData) {
    flow.create("delete user", {
        begin: function () {
            redisPersistence.deleteById("DefaultUser", userData.userId, this.continue("deleteReport"));
        },
        deleteReport: function (err, obj) {
            callback(err, obj);
        }
    })();
};

/*
 Sterge o organizatie
 */

deleteOrganisation = function (organisationId) {
    flow.create("delete organisation", {
        begin: function () {
            redisPersistence.deleteById("Organisation", organisationId, this.continue("deleteReport"));
        },
        deleteReport: function (err, obj) {
            callback(err, obj);
        }
    })();
};

/*
 Updateaza informatiile unui utilizator
 */

updateUser = function (userJsonObj, callback) {
    flow.create("update user", {
        begin: function () {
            redisPersistence.lookup.async("DefaultUser", userJsonObj.userId, this.continue("updateUser"));
        },
        updateUser: function (err, user) {
            if (err) {
                callback(err, null);
            }
            else {
                if (redisPersistence.isFresh(user)) {
                    callback(new Error("User with id " + userJsonObj.userId + " does not exist"), null);
                }
                else {
                    redisPersistence.externalUpdate(user, userJsonObj);
                    redisPersistence.saveObject(user, this.continue("updateReport"));
                }
            }
        },
        updateReport: function (err, user) {
            callback(err, user);
        }
    })();
};

/*
 queryUsers returneaza lista utilizatorilor apartinind de o organizatie
 */

queryUsers = function (organisationId, callback) {
    flow.create("get organisation users", {
        begin: function () {
            redisPersistence.filter("DefaultUser", {"organisationId": organisationId}, this.continue("getOrganisationUsers"));
        },
        getOrganisationUsers: function (err, users) {
            var organizationUsers = [];

            users.forEach(function (user) {
                if (user.is_active != false) {
                    delete user['password'];
                    organizationUsers.push(user);
                }
            });

            callback(err, organizationUsers);
        }
    })();
}

activateUser = function(activationCode,callback){
    filterUsers({"activationCode":activationCode},function(err,users){
        if(err){
            callback(err);
        }else if(users.length===0){
            callback(new Error("No user with activation code "+activationCode));
        }else{
            users[0].activationCode = "0";
            redisPersistence.saveObject(users[0],callback)
        }
    })
}
/*
 Creeaza o organizatie
 */

createOrganisation = function (organisationDump, callback) {
    flow.create("create organisation", {
        begin: function () {
            redisPersistence.lookup("Organisation", organisationDump.organisationId, this.continue("createOrganisation"));
        },
        createOrganisation: function (err, organisation) {
            if (err) {
                callback(err, null);
            }
            else {
                if (!redisPersistence.isFresh(organisation)) {
                    callback(new Error("Organisation with id " + organisationDump.organisationId + " already exists"), null);
                }
                else {
                    redisPersistence.externalUpdate(organisation, organisationDump);
                    redisPersistence.saveObject(organisation, this.continue("createReport"));
                }
            }
        },
        createReport: function (err, organisation) {
            callback(err, organisation);
        }
    })();
}

/*
 Realizeaza salvarea datelor despre o organizatie
 */

updateOrganisation = function (organisationDump, callback) {
    flow.create("update organization", {
        begin: function () {
            redisPersistence.lookup("Organisation", organisationDump.organisationId, this.continue("updateOrganisation"));
        },

        updateOrganisation: function (err, organisation) {
            if (err) {
                callback(err, null);
            }

            else if (redisPersistence.isFresh(organisation)) {
                callback(new Error("Organisation with id " + organisationDump.organisationId + " was not found"), null);
            }
            else {
                redisPersistence.externalUpdate(organisation, organisationDump);
                redisPersistence.saveObject(organisation, this.continue("updateReport"));
            }
        },
        updateReport: function (err, organisation) {
            callback(err, organisation);
        }
    })();
};

newUserIsValid = function (newUser, callback) {
    flow.create("user is valid", {
        begin: function () {

            if(!newUser.email){
                callback(new Error("Email is invalid!"));
            }
            else

            if(!newUser.password || newUser.password.length < passwordMinLength){
                callback(new Error("Password must contain at least "+passwordMinLength+" characters"));
            }

            else{
                redisPersistence.filter("DefaultUser", {email:newUser.email}, this.continue("verifyPasswords"))
            }

        },
        verifyPasswords: function (err, users) {
            if (err) {
                callback(err);
            }
            else if (users.length > 0) {
                callback(new Error("Email is unavailable"));
            }
            else {
                if (newUser.password != newUser.repeat_password) {
                    callback(new Error("Passwords doest not match"));
                }
                else {
                    createUser({
                        password: newUser.password,
                        email: newUser.email,
                        organisationId: "Public",
                        activationCode:new Buffer(uuid.v1()).toString('base64')
                    }, function (err, user) {
                        delete user['password'];
                        delete user['salt'];
                        delete user['__meta'];
                        callback(err, user);
                    });
                }
            }
        }
    })();
}

/*
 Returneaza lista de organizatii
 */

getOrganisations = function (callback) {
    flow.create("get all organizations", {
        begin: function () {
            redisPersistence.filter("Organisation", this.continue("info"));
        },
        info: function (err, result) {
            callback(err, result);
        }
    })();
}

/*
 Returneaza informatii despre un utilizator
 */

getUserInfo = function (userId, callback) {
    flow.create("retrieve user info", {
        begin: function () {
            redisPersistence.findById("DefaultUser", userId, this.continue("info"));
        },
        info: function (err, user) {
            if (err) {
                callback(err, null);
            } else if (user) {
                delete user['__meta'];
                delete user['password'];
                delete user['salt'];
                callback(null, user);
            }
            else {
                callback(null, null);
            }
        }
    })();
};

validateUser = function (email, pass, callback) {
    flow.create("Validate Password", {
        begin: function () {
            redisPersistence.filter("DefaultUser", {email: email}, this.continue("validatePassword"));
        },
        validatePassword: function (err, users) {
            if(err){
                callback(err);
            }else if(users.length === 0 || !pass){
                callback( new Error("invalidCredentials"));
            }
            else{
                var user = users[0];
                hashThisPassword(pass, user.salt, function (err, hashedPassword) {
                    if (err) 
                        callback(err);
                    else if (hashedPassword !== user.password) 
                        callback(new Error("invalidCredentials"));
                    else if(user.activationCode!=="0") 
                        callback(new Error("account_not_activated"));
                    else
                        callback(null,user.userId);
                });
            }
        }
    })();
}

getUserId = function(email, callback){
    redisPersistence.filter("DefaultUser",{"email":email},function(err,result){
        if(err){
            callback(err);
        }else if(result.length>1){
            callback(new Error("Multiple users with email "+email));
        }else if(result.length===0){
            callback(new Error("No user with the specified email"))
        }
        else{
            callback(undefined,result[0].userId);
        }
    });
}

changeUserPassword = function(userId, currentPassword, newPassword, callback){
    flow.create("Validate Password", {
        begin: function () {

            if (newPassword === currentPassword) {
                callback(new Error("You should enter different passwords"), false);
            }
            else if (newPassword.length < passwordMinLength) {
                callback(new Error("Your new password it too short! It should have at least " + passwordMinLength + " characters "), false);
            }
            else{
                redisPersistence.findById("DefaultUser", userId, this.continue("validatePassword"));
            }
        },
        validatePassword: function (err, user) {
            var self = this;
            if (err || ! user) {
                callback(err, null);
            }
            else{
                hashThisPassword(currentPassword,user.salt,function(err,hashedPassowrd){
                    if(hashedPassowrd===user.password){
                        self.storeNewPassword(user,newPassword,callback);
                    }else{
                        callback(new Error("The password you provided does not match our records"));
                    }
                })
            }
        },
        storeNewPassword:setNewPassword
    })();
};

setNewPassword = function(user,newPassword,callback){
    //this function also activates the user if he/she is not activated!!!
    user.salt = crypto.randomBytes(48).toString('base64');
    hashThisPassword(newPassword,user.salt,function(err,hashedPassword){
        user.password = hashedPassword;
        user.activationCode = "0";
        redisPersistence.saveObject(user,callback);
    });
}

function hashThisPassword(plainPassword,salt,callback){
    crypto.pbkdf2(plainPassword, salt, 20000, 512, 'sha512',function(err,res){
        if(err){
            callback(err)
        }
        else{
            callback(undefined,res.toString('base64'));
        }
    });
}

container.declareDependency("UsersManagerAdapter", ["redisPersistence"], function (outOfService, redisPersistence) {
    if (!outOfService) {
        console.log("Enabling persistence...", redisPersistence);

    } else {
        console.log("Disabling persistence...");
    }
});

setTimeout(function() {
    startSwarm("initOperando.js", "init");
},2000);
