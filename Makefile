# Hugo dev server (background + PID file for stop/restart)
#
#   make start     # backgrounds hugo server
#   make stop
#   make restart

HUGO ?= hugo
PORT ?= 1313
PIDFILE := .hugo-server.pid
LOGFILE := hugo-server.log

.PHONY: start stop restart

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
	echo $$! > $(PIDFILE); \
	echo "Hugo PID $$(cat $(PIDFILE)) — http://127.0.0.1:$(PORT)/"

stop:
	@if [ ! -f $(PIDFILE) ]; then echo "Nothing to stop (no $(PIDFILE))."; exit 0; fi; \
	pid=$$(cat $(PIDFILE)); \
	if kill -0 $$pid 2>/dev/null; then kill $$pid && echo "Stopped Hugo (PID $$pid)."; \
	else echo "Removed stale PID $$pid"; fi; \
	rm -f $(PIDFILE)

restart:
	@$(MAKE) stop
	@$(MAKE) start
