FROM node:22-bookworm-slim

# Install Python and pip

RUN apt-get update && apt-get install -y --no-install-recommends 
python3 
python3-pip 
python3-venv 
build-essential 
&& rm -rf /var/lib/apt/lists/*

# Set the application directory

WORKDIR /app

# Install Node.js dependencies

COPY package*.json ./
RUN npm install

# Install Python dependencies in a virtual environment

COPY requirements.txt ./
RUN python3 -m venv /opt/insightflow-venv 
&& /opt/insightflow-venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy the remaining project files

COPY . .

# Make Node.js use the Python environment containing the dependencies

ENV PYTHON_PATH=/opt/insightflow-venv/bin/python

# Start the backend

CMD ["npm", "start"]
