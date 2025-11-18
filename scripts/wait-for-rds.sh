#!/bin/bash
echo "⏳ Esperando a que RDS esté disponible y público..."
while true; do
  STATUS=$(aws rds describe-db-instances --db-instance-identifier eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null)
  PUBLIC=$(aws rds describe-db-instances --db-instance-identifier eventmasterstack-dev-eventmasterdbb78d4b62-wehp1qjste3v --query 'DBInstances[0].PubliclyAccessible' --output text 2>/dev/null)
  
  echo "Estado: $STATUS, Público: $PUBLIC"
  
  if [ "$STATUS" = "available" ] && [ "$PUBLIC" = "True" ]; then
    echo "✅ RDS está disponible y público!"
    break
  fi
  
  if [ "$STATUS" != "modifying" ] && [ "$STATUS" != "available" ]; then
    echo "⚠️  Estado inesperado: $STATUS"
    break
  fi
  
  sleep 15
done
