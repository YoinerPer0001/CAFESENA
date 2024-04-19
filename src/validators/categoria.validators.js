import {check} from "express-validator";
import { validateResult } from "../utils/validators.utils.js";


export const validateCreate =[
    check('Nom_Cat').exists().withMessage('Nom_Cat is required')
    .not().isEmpty().withMessage('Nom_Cat must not be empty')
    .isString().withMessage('Nom_Cat must be a string'),
    (req,res,next) => {
        validateResult(req, res, next);
    }
]

export const validateUpdate = [
    check('Nom_Cat').optional().isString().withMessage('Nom_Cat must be a string')
        .not().isEmpty().withMessage('Nom_Cat cannot be empty'),
        (req, res, next) => {
    validateResult(req, res, next);
}
]