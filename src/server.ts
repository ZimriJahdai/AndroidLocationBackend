import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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

app.get('/api/forms', async (_req, res) => {
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
