# Imagen del backend para Render (Render no tiene runtime nativo de Java, por eso va con Docker).

# Etapa 1: compila el jar con Maven
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# Etapa 2: imagen liviana solo con el JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# La instancia gratis de Render tiene 512 MB: limitamos el heap y usamos un GC liviano
# para que no se quede sin memoria. Render define PORT y Spring lo lee (server.port=${PORT:8080}).
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
