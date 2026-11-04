# MarketPilot

MarketPilot is a context-aware, agent-driven trading assistant designed to eliminate the cognitive latency that causes retail investors to lose their edge. By automating the entire research-to-execution pipeline, MarketPilot compresses hours of manual charting and news reading into a clean, autonomous daily workflow. 

Leveraging a stateful multi-agent architecture, the platform independently scrapes targeted financial news, evaluates market sentiment using Large Language Models, fuses it with historical NSE price action, and predicts next-day trajectories using an XGBoost classifier. When high-probability setups align with user-defined parameters, MarketPilot automatically queues Good Till Triggered (GTT) orders directly into the user's Zerodha brokerage account.

---

## 🚀 Core Features

* **Stateful Multi-Agent Orchestration:** Built with LangGraph, utilizing specialized AI nodes to handle unpredictable market variables dynamically.
* **Targeted News Extraction:** A decoupled headless Selenium engine bypasses JavaScript blockers to scrape real-time headlines exclusively for the user's active watchlist.
* **LLM Sentiment Feature Engineering:** Unstructured article text is processed through an open-weight financial LLM (e.g., FinBERT) to extract structured, numerical sentiment scores (-1.0 to 1.0).
* **Predictive ML Pipeline:** An XGBoost time-series classifier merges LLM sentiment scores with historical NSE telemetry fetched via the Zerodha Kite API.
* **Automated Broker Execution:** Seamless daily OAuth flow captures short-lived Zerodha access tokens to execute zero-touch GTT limit orders before the market opens.
* **In-App Market Dashboard:** A responsive UI featuring an aggregated news feed, individual stock execution toggles, and live broker connection status, optimized with a 2-hour database caching layer to ensure lightning-fast load times.

---

## 🧠 The Agentic Workflow (LangGraph)

MarketPilot replaces traditional linear cron scripts with an autonomous agent graph:

1. **Scraper Agent:** Wakes up according to the user's daily rhythm preferences. It checks the SQL database for the user's watchlist and fires up Selenium to gather the morning headlines, updating the `NewsCache` table.
2. **Quant Agent:** Acts as the mathematical core. It passes the scraped text to the Hugging Face sentiment pipeline, pulls historical OHLC (Open, High, Low, Close) and Volume data via Zerodha, merges the datasets, and runs the XGBoost prediction model.
3. **Risk Management Agent:** Evaluates the Quant Agent's prediction against broader market volatility (e.g., NIFTY 50 trends). If a trade setup is too risky, this agent vetoes the execution.
4. **Execution Agent:** If a stock passes risk checks and the user has the "GTT Alert" toggle enabled with saved price parameters, this agent securely pushes the limit order to the Zerodha API.

---

## 🛠️ Technology Stack

**Backend & Infrastructure**
* **Python 3.10+**: Core application language.
* **Flask**: Web framework handling routing, OAuth callbacks, and dashboard rendering.
* **SQLAlchemy**: ORM for managing Users, Watchlists, and the News Cache.
* **SQLite / PostgreSQL**: Relational database management.

**AI & Machine Learning**
* **LangGraph**: Framework for orchestrating the stateful multi-agent workflow.
* **Transformers (Hugging Face)**: NLP pipeline for FinBERT sentiment extraction.
* **Scikit-Learn & XGBoost**: Data scaling, feature engineering, and time-series classification.

**Market Operations & Data Aggregation**
* **Zerodha Kite Connect API**: Direct broker integration for live telemetry and GTT order execution.
* **Selenium WebDriver**: Headless browser automation for dynamic web scraping.

**Frontend**
* **HTML5, CSS3, Bootstrap**: Responsive layout structure.
* **Jinja2**: Server-side HTML templating for dynamic data rendering.

---

## 🗄️ Database Architecture

MarketPilot utilizes a lean relational schema optimized for solo deployment and rapid access:
* **`User` Table:** Stores profile data and the daily `zerodha_access_token` (updated daily per SEBI regulations).
* **`Watchlist` Table:** Maps users to their tracked tickers (e.g., INFY, RELIANCE) and stores the state of their GTT execution toggles.
* **`NewsCache` Table:** Stores scraped headlines, URLs, and LLM sentiment labels with a `scraped_at` timestamp. The backend validates this timestamp, only triggering the heavy Selenium scraper if the cached data is older than 2 hours.

---

## ⚙️ Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/MarketPilot.git
cd MarketPilot
```

### 2. Environment Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure your API keys:
```ini
FLASK_SECRET_KEY=your_secure_flask_key
KITE_API_KEY=your_zerodha_api_key
KITE_API_SECRET=your_zerodha_api_secret
DATABASE_URI=sqlite:///marketpilot.db
```

### 4. Initialize the Database
```bash
flask shell
>>> from models import db
>>> db.create_all()
>>> exit()
```

### 5. Run the Application
```bash
flask run
```
Access the dashboard at `http://127.0.0.1:5000`. Navigate to the Broker Connection tab to complete the daily Zerodha OAuth login.

---

## ⚠️ Disclaimer

MarketPilot is built for educational and research purposes. Algorithmic trading involves significant risk. The developers are not responsible for any financial losses incurred while using this software. Always test automated execution strategies in a sandbox or with paper-trading accounts before deploying live capital.
