FROM node:24.0.0-alpine  as build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_APP_TITLE
ARG VITE_APP_LOGO

RUN if [ -n "$VITE_API_URL" ]; then \
    echo "VITE_API_URL=$VITE_API_URL" >> .env.production; \
    fi && \
    if [ -n "$VITE_APP_TITLE" ]; then \
    echo "VITE_APP_TITLE=$VITE_APP_TITLE" >> .env.production; \
    fi && \
    if [ -n "$VITE_APP_LOGO" ]; then \
    echo "VITE_APP_LOGO=$VITE_APP_LOGO" >> .env.production; \
    fi

    
RUN npm run build


# Etapa Final
FROM nginx:alpine

# Esto crea un usuario no root para correr nginx
RUN adduser -D -H -u 1001 -s /sbin/nologin webuser

# Creamos la carpeta
RUN mkdir -p /app/www
# Copiamos los archivos estáticos desde la etapa builder
COPY --from=build /app/dist /app/www

# Copiamos configuración de nginx
COPY docker/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx","-g","daemon off;"]