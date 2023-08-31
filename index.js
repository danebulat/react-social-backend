import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import path    from 'path';
import helmet  from 'helmet';
import morgan  from 'morgan';
import multer  from 'multer';
import config  from './config.js';
import { fileURLToPath }  from 'url';

import authRouter from './routes/auth.js';
import userRouter from './routes/users.js';
import postRouter from './routes/posts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('common'));

//TODO: verify user before upload
//TODO: put file upload in separate module
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads')
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + file.originalname;
    req.newFilename = fileName;
    cb(null, fileName);
  },
});

const upload = multer({storage});

router.post('/api/upload', upload.single("file"), (req, res) => {
  try {
    return res.status(200).json({ fileName: req.newFilename });
  }
  catch (err) {
    console.log(err);
  }
});

/* ---------------------------------------- */
/* Public directory                         */
/* ---------------------------------------- */

//TODO: builddir/subdir
app.use('/images', express.static(
  path.join(__dirname, 'public/uploads')));

router.use(express.static(
  path.resolve(path.join(__dirname, `/${config.builddir}`)))
);

/* ---------------------------------------- */
/* Pass router to subdir                    */
/* ---------------------------------------- */

app.use(`${config.subdir}/api`,       authRouter);
app.use(`${config.subdir}/api/users`, userRouter);
app.use(`${config.subdir}/api/posts`, postRouter);
app.use(config.subdir, router);

/* ---------------------------------------- */
/* Error handler middleware                 */
/* ---------------------------------------- */

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });
});

/* -------------------------------------------------- */
/* Catch-all route to index.html                      */
/* -------------------------------------------------- */

router.get('/*', (_req, res) => {
  res.sendFile(path.resolve(__dirname + `/${config.builddir}/index.html`));
});

/* ---------------------------------------- */
/* Listen                                   */
/* ---------------------------------------- */

console.log('builddir: ' + path.join(__dirname, `/${config.builddir}`));
console.log(`subdir: ${config.subdir}`);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
