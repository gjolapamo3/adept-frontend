import { Router } from 'express';
import { validate } from '../middleware/validateRequest';
import { b2bOrderSchema } from '../shared/schemas';

const router = Router();

router.post('/orders', validate(b2bOrderSchema), (req, res) => {
  // Safe data guaranteed after middleware validation.
  res.status(201).json({ message: 'Order submitted successfully' });
});

export default router;
