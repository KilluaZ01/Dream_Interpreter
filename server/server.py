from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import random
import nltk
import tflearn
import json
import pickle
import os
from nltk.stem import LancasterStemmer
from fastapi import HTTPException
import traceback
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Setup
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ✅ allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stemmer = LancasterStemmer()
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab')

# Load intents and model data
with open(os.path.join(BASE_DIR, "chatbot-model", "intents.json")) as f:
    intents = json.load(f)

with open(os.path.join(BASE_DIR, "chatbot-model", "data.pickle"), 'rb') as f:
    words, labels, training, output = pickle.load(f)

# Rebuild model (must match training architecture)
net = tflearn.input_data(shape=[None, len(training[0])])
net = tflearn.fully_connected(net, 17)
net = tflearn.fully_connected(net, 17)
net = tflearn.fully_connected(net, len(output[0]), activation='softmax')
net = tflearn.regression(net)

model = tflearn.DNN(net)

checkpoint_path = os.path.join(BASE_DIR, 'chatbot-model','models', 'model.tflearn')
model.load(checkpoint_path)

# Input validation schema
class Message(BaseModel):
    text: str

# Bag-of-words function
def bag_of_words(sentence, words):
    bag = [0 for _ in range(len(words))]
    s_words = nltk.word_tokenize(sentence)
    s_words = [stemmer.stem(word.lower()) for word in s_words]

    for se in s_words:
        for i, w in enumerate(words):
            if w == se:
                bag[i] = 1

    return np.array(bag)

# Serve HTML frontend
@app.get("/", response_class=HTMLResponse)
async def get_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

# API route for chatbot response
@app.post("/chat")
async def chat(message: Message):
    try:
        print("User input:", message.text)

        bow = bag_of_words(message.text, words)
        results = model.predict([bow])[0]
        results_index = np.argmax(results)
        tag = labels[results_index]

        if results[results_index] > 0.5:
            for intent in intents["intents"]:
                if intent["tag"] == tag:
                    response = random.choice(intent["responses"])
                    print("Bot response:", response)
                    return {"response": response}

        return {"response": "I didn't get that. Could you try saying it differently?"}
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
# uvicorn server:app --reload