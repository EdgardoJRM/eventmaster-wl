#!/bin/bash

# Script para monitorear el deploy de CDK

LOG_FILE="/tmp/cdk-deploy-magic-link.log"

echo "🔍 Monitoreando deploy de CDK..."
echo ""

while true; do
    if [ -f "$LOG_FILE" ]; then
        # Mostrar últimas 10 líneas
        tail -10 "$LOG_FILE" 2>/dev/null
        
        # Verificar si terminó
        if grep -q "Stack EventMasterStack-dev" "$LOG_FILE" 2>/dev/null; then
            if grep -q "CREATE_COMPLETE\|UPDATE_COMPLETE" "$LOG_FILE" 2>/dev/null; then
                echo ""
                echo "✅ Deploy completado!"
                break
            fi
            if grep -q "CREATE_FAILED\|UPDATE_FAILED\|ROLLBACK" "$LOG_FILE" 2>/dev/null; then
                echo ""
                echo "❌ Deploy falló. Revisa los logs."
                break
            fi
        fi
    fi
    
    sleep 5
done

echo ""
echo "📊 Resumen del deploy:"
tail -20 "$LOG_FILE" 2>/dev/null | grep -E "(CREATE_|UPDATE_|Stack|Outputs)" || echo "Revisa el log completo en $LOG_FILE"

