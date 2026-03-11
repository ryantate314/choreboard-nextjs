docker run --rm -p 3001:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e DATABASE_URL='postgresql://choreboard:Passw0rd!@host.docker.internal:5432/choreboard' \
  -e TZ=UTC \
  taterbase-debug