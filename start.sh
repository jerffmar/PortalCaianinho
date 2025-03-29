docker stop portalcaianinho
docker rm portalcaianinho
docker build -t portalcaianinho .
docker run -d --name portalcaianinho -p 80:80 -p 3123:3123 portalcaianinho
docker logs --tail 1000 -f portalcaianinho