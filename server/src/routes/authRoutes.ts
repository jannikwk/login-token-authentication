import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController";
import { requireAuth } from "../middleware/requireAuth";
import { validateBody } from "../middleware/validateBody";
import { CredentialsSchema } from "@app/shared";
import { InvalidCredentialsError } from "../errors/applicationErrors";

const router = Router();

router.post("/login", validateBody(CredentialsSchema, () => new InvalidCredentialsError()), login);
router.post("/register", validateBody(CredentialsSchema), register);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

export default router;