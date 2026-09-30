import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const compareSecret = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const expectedToken = process.env.ADMIN_TOKEN;
  const authorization = req.header('authorization') ?? '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();

  if (!expectedToken) {
    return res.status(500).json({
      message: 'ADMIN_TOKEN no está configurado'
    });
  }

  if (!token || !compareSecret(token, expectedToken)) {
    return res.status(401).json({
      message: 'No autorizado'
    });
  }

  return next();
};

const formSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    className: {
      type: String,
      required: true,
      trim: true
    },
    leaderName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    comment: {
      type: String,
      default: ''
    },
    location: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },
      accuracy: {
        type: Number,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

const Form = mongoose.model('Form', formSchema);

app.post('/api/forms', async (req, res) => {
  try {
    const { fullName, className, leaderName, phone, comment, location } = req.body;

    if (!fullName || !className || !leaderName || !phone || !location?.latitude || !location?.longitude) {
      return res.status(400).json({
        message: 'Nombre, clase, encargado, teléfono y ubicación son obligatorios'
      });
    }

    const form = await Form.create({
      fullName,
      className,
      leaderName,
      phone,
      comment,
      location
    });

    return res.status(201).json({
      message: 'Formulario guardado correctamente',
      formId: form._id
    });
  } catch {
    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminPassword || !adminToken) {
    return res.status(500).json({
      message: 'Credenciales de administrador no configuradas'
    });
  }

  if (!password || !compareSecret(password, adminPassword)) {
    return res.status(401).json({
      message: 'Contraseña incorrecta'
    });
  }

  return res.json({
    token: adminToken
  });
});

app.get('/api/forms', requireAdmin, async (_req, res) => {
  const forms = await Form.find().sort({ createdAt: -1 });
  res.json(forms);
});

const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;
  const port = process.env.PORT || 3000;

  if (!mongoUri) {
    throw new Error('MONGO_URI no está configurado');
  }

  await mongoose.connect(mongoUri);

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
};

startServer();
