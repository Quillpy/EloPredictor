import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from xgboost import XGBRegressor
import joblib

def main():
    df = pd.read_csv('pure_chess.csv')
    df = df.dropna(subset=['WhiteElo', 'BlackElo', 'moves'])
    
    vectorizer = TfidfVectorizer(max_features=10000, lowercase=False)
    X = vectorizer.fit_transform(df['moves'])
    
    y_white = df['WhiteElo']
    model_white = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.1, n_jobs=-1)
    model_white.fit(X, y_white)
    
    y_black = df['BlackElo']
    model_black = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.1, n_jobs=-1)
    model_black.fit(X, y_black)
    
    joblib.dump(vectorizer, 'vectorizer.joblib')
    joblib.dump(model_white, 'model_white.joblib')
    joblib.dump(model_black, 'model_black.joblib')

if __name__ == "__main__":
    main()
