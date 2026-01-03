import { getMe } from "../services/me.service.js";

export async function me(req, res, next) {
  try {
    const out = await getMe(req.user.id);
    res.json({ ok: true, user: out });
  } catch (err) {
    next(err);
  }
}
