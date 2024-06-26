import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import { adminPermissions } from "../utils/manage.permissions.js"
import { mensajeEnviar } from "../utils/Emailmessages/verification.message.js";
import { mensaje_Confirm_Login } from "../utils/Emailmessages/login_verification.message.js";
import { response } from "../utils/responses.js";
import { GenCodigosTemp } from "../utils/GenCodTemp.js";
import cookieParser from "cookie-parser";
import { serialize } from "cookie";
import uniqid from 'uniqid';
import Usuario from "../models/users.model.js";
import 'dotenv/config'
import Token from "../models/tokens.model.js";
import Localizacion from "../models/localizacion.model.js";

const jwt = jsonwebtoken;

// get all users--- ok
export const getUsers = async (req, res) => {

    try {

        const users = await Usuario.findAll(
            { attributes: { exclude: ['Pass_User', 'createdAt', 'updatedAt', 'ESTADO_REGISTRO'] },
            where:{ESTADO_REGISTRO: 1}
         });
        if (users) {
            response(res, 200, 200, users);
        } else {
            response(res, 404, 404, "Users not found");
        }

    } catch (err) {
        response(res, 500, 500, err);
    }



}

// get users x id --- ok
export const getUserxId = async (req, res) => {

    try {

        const { id } = req.params;

        //mostramos datos de usuarios
        const users = await Usuario.findByPk(id, { attributes: { exclude: ['Pass_User', 'createdAt', 'updatedAt'] } });
        if (users) {
            response(res, 200, 200, users);
        } else {
            response(res, 404, 404, "Users not found");
        }

    } catch (err) {
        response(res, 500, 500, err);
    }


}

//register user 
export const regUser = async (req, res) => {

    try {

        const datos = req.body;

        const passEncripted = await bcrypt.hash(datos.Pass_User, 10);


        //verificamos que no exista EMAIL/TEL
        const user = await Usuario.findOne({ where: { Ema_User: datos.Ema_User, ESTADO_REGISTRO: 1 } });

        if (user == null) {

            const Id_User = uniqid();

            const DataEnv = {
                Id_User: Id_User,
                Nom_User: datos.Nom_User,
                Ape_User: datos.Ape_User,
                Ema_User: datos.Ema_User,
                Pass_User: passEncripted,
                Id_Rol_FK: 3,
            }

            //insert data in database
            const userInserted = await Usuario.create(DataEnv);

            if (userInserted) {

                // //generamos un codigo que se guardara en la base de datos
                const { codigo, exp } = await GenCodigosTemp(600);

                const DataToken = {
                    Token: codigo,
                    Fec_Caducidad: exp,
                    User_Id_FK: Id_User
                }

                //guardamos el token en la base de datos
                const token = await Token.create(DataToken);

                if (token) {
                    // //guardamos localizacion del usuario

                    const objLoc = {
                        Dir_Ip: datos.Dir_Ip,
                        Id_User_FK: Id_User
                    }

                    const locate = await Localizacion.create(objLoc);

                    if (locate) {
                        response(res, 200, 200);
                        mensajeEnviar(datos.Ema_User, datos.Nom_User, codigo, datos.Pass_User);
                    } else {
                        response(res, 500, 500, "");
                    }
                } else {
                    response(res, 500, 500, "Error Token not added");
                }

            } else {

                response(res, 500, 500, "Error User not created");

            }




        } else {
            response(res, 409, 409, "Email is registered");
        }

    } catch (err) {

        response(res, 500, 500, err);
    }
}

//UPDATE USERS data 
export const UpdateUserData = async (req, res) => {

    try {

        const { id } = req.params;

        const UserData = req.body;
        let NewEmail = null;

        //get actual data
        let actualData = await Usuario.findByPk(id);

        if (actualData) {
            actualData = actualData.dataValues;

            if (UserData.Ema_User) {
                const user = await Usuario.findOne({ where: { Ema_User: UserData.Ema_User } });

                if (user) {
                    return response(res, 409, 409, "Email is registered");
                }else{
                    NewEmail = UserData.Ema_User;
                }
            }

            const objUpdate = {

                Nom_User: UserData.Nom_User || actualData.Nom_User,
                Ape_User: UserData.Ape_User || actualData.Ape_User,
                Tel_User: UserData.Tel_User || actualData.Tel_User,
                Ema_User: NewEmail || actualData.Ema_User,
                Fot_User: UserData.Fot_User || actualData.Tel_User,
                ESTADO_REGISTRO: UserData.ESTADO_REGISTRO || actualData.ESTADO_REGISTRO
            }

            //update data

            const updatedData = await Usuario.update(objUpdate, { where: { Id_User: id } });

            if (updatedData) {
                response(res, 200, 200);
            } else {
                response(res, 500, 500, "Error updating");
            }

        } else {
            response(res, 404, 404, "User not found");
        }

    } catch (err) {
        response(res, 500, 500, err);
    }

}

//Validate Email 
export const ValidateEmail = async (req, res) => {

    try {
        const datos = req.body;

        if (!datos.Id_User || !datos.codigo) {

            response(res, 500, 500, "something went wrong");

        } else {

            // verificamos que exista el usuario
            let user = await Usuario.findByPk(datos.Id_User)

            if (user) {
                user = user.dataValues;

                //verificamos que el codigo sea valido
                let token = await Token.findOne({ where: { User_Id_FK: datos.Id_User, token: datos.codigo } })

                if (token) {
                    token = token.dataValues;

                    const fechaActual = Math.floor(Date.now() / 1000);
                    const fechaExp = token.Fec_Caducidad;

                    // verificamos que no este expirado el codigo
                    if (fechaActual > fechaExp) {
                        response(res, 401, 401, "Expired token");
                    } else {
                        // actualizamos el estado del Email a verificado
                        const updatedUser = await Usuario.update({ 'Est_Email_User': 1 }, { where: { Id_User: datos.Id_User } });

                        if (updatedUser) {
                            response(res, 200, 200);
                        } else {
                            response(res, 500, 500, "Error changing email status");
                        }
                    }

                } else {
                    response(res, 401, 401, "Incorrect code");
                }

            } else {

                response(res, 404, 404, "User not found");
            }


        }





    } catch (err) {
        if (err.errno) {

            response(res, 400, err.errno, err.code);

        } else {
            response(res, 500, 500, "something went wrong");

        }
    }
}

//login user
export const loginUser = async (req, res) => {



    const { Ema_User, Pass_User, Dir_Ip } = req.body;


    let user = await Usuario.findOne({ where: { Ema_User: Ema_User, ESTADO_REGISTRO: 1 } });


    if (user) {
        user = user.dataValues;

        //verificamos la password
        const passDecripted = await bcrypt.compare(Pass_User, user.Pass_User);

        if (passDecripted) {// if password true

            //verificamos la direccion ip se encuentre registrada previamente
            const objLoc = {
                Id_User_FK: user.Id_User,
                Dir_Ip: Dir_Ip
            }

            let loc = await Localizacion.findOne({ where: objLoc });


            //VERIFICAMOS IP

            if (loc) {
                loc = loc.dataValues;

                // si existe generamos el token y lo guardamos en la db
                const userData = {
                    Id_User: user.Id_User,
                    Nom_User: user.Nom_User,
                    Ape_User: user.Ape_User,
                    Ema_User: user.Ema_User,
                    Id_Rol_FK: user.Id_Rol_FK,
                }

                //generamos token y save on db
                const datosToken = await TokenDb(userData);

                if (datosToken) {

                    const tokendecode = jwt.decode(datosToken, process.env.SECRETWORD);
                    const data1 = {
                        User_Id_FK: userData.Id_User,
                        Token: datosToken,
                        Fec_Caducidad: tokendecode.exp,
                        Tipo_token: 2
                    }


                    // guardamos en Db
                    const resp = await Token.create(data1)


                    if (resp) {
                        const cookieP = cookieParser();


                        //serializar
                        const serialized = serialize('sessionToken', datosToken, {
                            httpOnly: true,
                            secure: true,
                            sameSite: 'none',
                            maxAge: 86400000,
                            path: '/'
                        })
                        res.setHeader('Set-Cookie', serialized)

                        response(res, 200, 200, "success Login");

                    } else {

                        response(res, 500, 500, "Error saving token");
                    }




                }



            } else {


                //enviamos codigo de verificacion para guardar la nueva ip
                const { codigo, exp } = await GenCodigosTemp(600);
                //guardamos en la base de datos
                const objTok = {
                    Token: codigo,
                    Fec_Caducidad: exp,
                    User_Id_FK: user.Id_User,
                    Tipo_token: 3
                }



                //guardamos el token en la db
                const token = await Token.create(objTok)


                if (token) {
                    mensaje_Confirm_Login(user.Ema_User, user.Nom_User, codigo);

                    response(res, 401, 401, "Verification code send success (update new ip)");
                }

            }

        } else {

            response(res, 400, 103, "User or password incorrect");
        }

    } else {
        response(res, 400, 103, "User or password incorrect");
    }

}

//validate cods Ip new
export const ValidateCod = async (req, res) => {

    try {

        const { Id_User, codigo, Dir_Ip } = req.body;

        // verificamos que exista el usuario
        const user = await Usuario.findByPk(Id_User)

        if (user) {
            //verificamos que el token coincida
            const datos = {
                User_Id_FK: Id_User,
                token: codigo
            }

            let token = await Token.findOne({ where: datos })

            if (token) {
                token = token.dataValues;


                const fechaActual = Math.floor(Date.now() / 1000);
                const fechaExp = token.Fec_Caducidad;

                // verificamos que no este expirado el codigo
                if (fechaActual > fechaExp) {
                    response(res, 400, 106, "Expired token");
                } else {

                    const datosLoc = {
                        Id_User_FK: Id_User,
                        Dir_Ip: Dir_Ip
                    }

                    // Insertar la nueva IP
                    const location = await Localizacion.create(datosLoc)
                    console.log(location)
                    if (location) {
                        response(res, 200, 200);
                    } else {
                        response(res, 500, 500, "Error saving ip new");
                    }

                }

            } else {
                response(res, 400, 105, "Something went wrong");
            }



        } else {

            response(res, 400, 103, "Something went wrong");
        }




    } catch (err) {
        if (err.errno) {

            response(res, 400, err.errno, err.code);

        } else {
            response(res, 500, 500, "something went wrong");

        }
    }
}


//funtions

// create token
export const TokenDb = async (userData) => {


    const token = jwt.sign({ user: userData }, process.env.SECRETWORD, { expiresIn: '24h' });
    // const tokendecode = jwt.decode(token, process.env.SECRETWORD);
    // const data1 = {
    //     Id_User:userData.Id_User,
    //     codigo: token,
    //     exp: tokendecode.exp,
    // }

    return token;

}

export const deleteUser = async (req, res, ) => {
    try {
        const { id } = req.params;
        const user = await Usuario.findByPk(id)
        if (!user) {
            response(res, 404, 404, 'user not found');
        } else {
            
            const deleted = await Usuario.update({ESTADO_REGISTRO: 0}, {where: {Id_User: id}})

            if(deleted){
                response(res, 200, 200);
            }else{
                response(res, 500, 500, 'Error Deleting');
            }
        }
        
    } catch (err) {
        response(res, 500, 500, err);
    }
    
}










