# Hugo dev server (background + PID file for stop/restart)
#
#   make setup     # installs hugo (via Homebrew) + JS deps if missing
#   make start     # backgrounds hugo server
#   make stop
#   make restart

HUGO ?= hugo
PORT ?= 1313
PIDFILE := .hugo-server.pid
LOGFILE := hugo-server.log

.PHONY: setup start stop restart

setup:
	@command -v $(HUGO) >/dev/null 2>&1 || { \
		echo "hugo not found — installing via Homebrew..."; \
		command -v brew >/dev/null 2>&1 || { echo "Homebrew not found. Install Hugo manually: https://gohugo.io/installation/"; exit 1; }; \
		brew install hugo; \
	}
	@npm ci
	@echo "Setup complete."

start:
	@if [ -f $(PIDFILE) ]; then \
		pid=$$(cat $(PIDFILE)); \
		if kill -0 $$pid 2>/dev/null; then \
			echo "Hugo already running (PID $$pid). Run 'make stop' first."; \
			exit 1; \
		else \
			rm -f $(PIDFILE); \
		fi; \
	fi; \
	nohup $(HUGO) server --port $(PORT) >> $(LOGFILE) 2>&1 & \
	pid=$$!; \
	sleep 0.5; \
	if ! kill -0 $$pid 2>/dev/null; then \
		echo "Hugo failed to start. Log tail:"; \
		tail -n 5 $(LOGFILE); \
		exit 1; \
	fi; \
	echo $$pid > $(PIDFILE); \
	echo "Hugo PID $$pid — http://127.0.0.1:$(PORT)/"

stop:
	@if [ ! -f $(PIDFILE) ]; then echo "Nothing to stop (no $(PIDFILE))."; exit 0; fi; \
	pid=$$(cat $(PIDFILE)); \
	if kill -0 $$pid 2>/dev/null; then kill $$pid && echo "Stopped Hugo (PID $$pid)."; \
	else echo "Removed stale PID $$pid"; fi; \
	rm -f $(PIDFILE)

restart:
	@$(MAKE) stop
	@$(MAKE) start
