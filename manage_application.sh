#!/bin/bash

# Traffic Prediction Application Management Script

echo "🚀 Traffic Prediction Application Manager"
echo "=========================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start Flask backend
start_flask() {
    echo "🐍 Starting Flask Backend..."
    if check_port 5001; then
        echo "   ⚠️  Port 5001 is already in use"
        echo "   Flask backend might already be running"
    else
        echo "   Starting Flask on port 5001..."
        cd UCS_Model-main
        conda run -n traffic-prediction python traffic_prediction_api.py &
        FLASK_PID=$!
        echo "   Flask PID: $FLASK_PID"
        cd ..
        sleep 3
        if check_port 5001; then
            echo "   ✅ Flask backend started successfully"
        else
            echo "   ❌ Failed to start Flask backend"
        fi
    fi
}

# Function to start Next.js frontend
start_nextjs() {
    echo "⚛️  Starting Next.js Frontend..."
    if check_port 3000; then
        echo "   ⚠️  Port 3000 is already in use"
        echo "   Next.js frontend might already be running"
    else
        echo "   Starting Next.js on port 3000..."
        npm run dev &
        NEXTJS_PID=$!
        echo "   Next.js PID: $NEXTJS_PID"
        sleep 5
        if check_port 3000; then
            echo "   ✅ Next.js frontend started successfully"
        else
            echo "   ❌ Failed to start Next.js frontend"
        fi
    fi
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping services..."
    
    # Stop Flask (port 5001)
    if check_port 5001; then
        echo "   Stopping Flask backend..."
        pkill -f "traffic_prediction_api.py" 2>/dev/null
        sleep 2
        if ! check_port 5001; then
            echo "   ✅ Flask backend stopped"
        else
            echo "   ⚠️  Flask backend might still be running"
        fi
    fi
    
    # Stop Next.js (port 3000)
    if check_port 3000; then
        echo "   Stopping Next.js frontend..."
        pkill -f "next dev" 2>/dev/null
        sleep 2
        if ! check_port 3000; then
            echo "   ✅ Next.js frontend stopped"
        else
            echo "   ⚠️  Next.js frontend might still be running"
        fi
    fi
}

# Function to check status
check_status() {
    echo "📊 Application Status"
    echo "===================="
    
    if check_port 5001; then
        echo "🐍 Flask Backend: ✅ RUNNING (port 5001)"
        # Test Flask health
        if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
            echo "   API Health: ✅ HEALTHY"
        else
            echo "   API Health: ❌ UNHEALTHY"
        fi
    else
        echo "🐍 Flask Backend: ❌ NOT RUNNING"
    fi
    
    if check_port 3000; then
        echo "⚛️  Next.js Frontend: ✅ RUNNING (port 3000)"
        # Test Next.js
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo "   Frontend: ✅ ACCESSIBLE"
        else
            echo "   Frontend: ❌ NOT ACCESSIBLE"
        fi
    else
        echo "⚛️  Next.js Frontend: ❌ NOT RUNNING"
    fi
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   • Main App: http://localhost:3000"
    echo "   • Flask API: http://localhost:5001"
}

# Function to run tests
run_tests() {
    echo "🧪 Running Application Tests..."
    conda run -n traffic-prediction python test_application.py
}

# Main menu
case "$1" in
    "start")
        echo "🚀 Starting Traffic Prediction Application..."
        start_flask
        start_nextjs
        echo ""
        check_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        echo "🔄 Restarting Traffic Prediction Application..."
        stop_services
        sleep 3
        start_flask
        start_nextjs
        echo ""
        check_status
        ;;
    "status")
        check_status
        ;;
    "test")
        run_tests
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both Flask backend and Next.js frontend"
        echo "  stop    - Stop both services"
        echo "  restart - Restart both services"
        echo "  status  - Check current status of services"
        echo "  test    - Run application tests"
        echo ""
        echo "Examples:"
        echo "  ./manage_application.sh start"
        echo "  ./manage_application.sh status"
        echo "  ./manage_application.sh test"
        exit 1
        ;;
esac