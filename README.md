# Chess ELO Predictor

This project contains an ELO predictor for chess matches. It predicts White and Black ELO ratings from the moves played in the match. 

The project has three main components:
1. Model training script (`train_colab.py`).
2. Python backend to serve the model (`backend/`).
3. React frontend to interact with the backend (`frontend/`).

## How the Model Works

The model takes the raw PGN string, extracts the SAN (Standard Algebraic Notation) moves as a space-separated sequence, and applies `TfidfVectorizer` (Term Frequency-Inverse Document Frequency). This turns the sequence of moves into a numerical array representing the importance/frequency of move patterns. Two `XGBRegressor` models (from XGBoost) are trained on this transformed text data—one to predict the White ELO, and the other to predict the Black ELO. XGBoost captures the non-linear relationship between move combinations and player skill.

## 1. How to train in Google Colab

1. Open Google Colab and create a new notebook.
2. Upload the `train_colab.py` file to the Colab environment.
3. Upload your `pure_chess.csv` dataset. The CSV must have at least three columns: `WhiteElo`, `BlackElo`, and `moves`.
4. Install requirements in Colab if needed: `!pip install xgboost pandas scikit-learn joblib`.
5. Run the training script: `!python train_colab.py`.
6. Once completed, three new files will be generated: `vectorizer.joblib`, `model_white.joblib`, and `model_black.joblib`.
7. Download these three `.joblib` files and place them inside the `backend/` directory of this project.

## 2. How to run Backend locally

1. Open your terminal and navigate to the project root directory.
2. Create and activate a python virtual environment (if not already done).
3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
4. Ensure `vectorizer.joblib`, `model_white.joblib`, and `model_black.joblib` are inside the `backend/` folder.
5. Start the FastAPI server:
   ```bash
   uvicorn app:app --reload
   ```
   The backend will run on `http://localhost:8000`.

## 3. How to run Frontend locally

1. Open a new terminal and navigate to the `frontend/` directory.
2. Install dependencies (if you haven't yet):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## 4. How to Deploy

### Deploying Backend on Render

1. Create a GitHub repository and push your project there.
2. Go to [Render](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the Root Directory to `backend/`.
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
7. Ensure your `.joblib` model files are tracked via Git LFS if they are large, or re-train/download them as part of the build step (Render offers free tier which might be restricted on space/RAM).

### Deploying Frontend on Vercel

1. Go to [Vercel](https://vercel.com) and create a new Project.
2. Import your GitHub repository.
3. Framework Preset: **Vite**
4. Root Directory: `frontend/`
5. In the Build and Output settings, keep the defaults (Build command: `npm run build`, Output directory: `dist`).
6. Click Deploy. Ensure your frontend makes API calls to the deployed Render backend URL (you might need to update the `http://localhost:8000` hardcoded URL in `App.jsx` to an environment variable).