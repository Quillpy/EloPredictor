import pandas as pd
import numpy as np
import joblib
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor


# --------------------------
# Feature engineering
# --------------------------
def extract_features(moves):
    tokens = moves.split()

    num_moves = len(tokens)
    checks = sum('+' in t or '#' in t for t in tokens)
    captures = sum('x' in t for t in tokens)
    castles = sum(t in ['O-O', 'O-O-O'] for t in tokens)
    promotions = sum('=' in t for t in tokens)
    avg_len = np.mean([len(t) for t in tokens]) if tokens else 0

    return [
        num_moves,
        checks,
        captures,
        castles,
        promotions,
        avg_len
    ]


def main():
    print("Loading...")
    df = pd.read_csv("pure_chess.csv")
    df = df.dropna(subset=["WhiteElo", "BlackElo", "moves"])

    print("Extracting handcrafted features...")
    numeric_features = np.array(df["moves"].apply(extract_features).tolist())

    print("Vectorizing moves...")
    vectorizer = TfidfVectorizer(
        max_features=50000,
        ngram_range=(1, 4),
        lowercase=False
    )

    X_text = vectorizer.fit_transform(df["moves"])
    X_num = csr_matrix(numeric_features)

    X = hstack([X_text, X_num])

    y_white = df["WhiteElo"]
    y_black = df["BlackElo"]

    X_train, X_test, yw_train, yw_test, yb_train, yb_test = train_test_split(
        X, y_white, y_black, test_size=0.1, random_state=42
    )

    print("Training White model...")
    model_white = XGBRegressor(
        n_estimators=1200,
        learning_rate=0.03,
        max_depth=10,
        subsample=0.9,
        colsample_bytree=0.9,
        objective='reg:squarederror',
        tree_method='hist',
        n_jobs=-1
    )

    model_white.fit(
        X_train,
        yw_train,
        eval_set=[(X_test, yw_test)],
        verbose=50
    )

    print("Training Black model...")
    model_black = XGBRegressor(
        n_estimators=1200,
        learning_rate=0.03,
        max_depth=10,
        subsample=0.9,
        colsample_bytree=0.9,
        objective='reg:squarederror',
        tree_method='hist',
        n_jobs=-1
    )

    model_black.fit(
        X_train,
        yb_train,
        eval_set=[(X_test, yb_test)],
        verbose=50
    )

    pred_white = model_white.predict(X_test)
    pred_black = model_black.predict(X_test)

    mae_white = mean_absolute_error(yw_test, pred_white)
    mae_black = mean_absolute_error(yb_test, pred_black)

    print(f"White MAE: {mae_white:.2f}")
    print(f"Black MAE: {mae_black:.2f}")

    print("Saving...")
    joblib.dump(vectorizer, "vectorizer.joblib")
    joblib.dump(model_white, "model_white.joblib")
    joblib.dump(model_black, "model_black.joblib")

    print("Done.")


if __name__ == "__main__":
    main()
