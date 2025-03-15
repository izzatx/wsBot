# wsBot

making an automation bot reply to each group using venom
docker build -t wsbot .
docker run --name wsbot-container -p 8080:8080 wsbot
