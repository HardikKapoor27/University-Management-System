# ─── Stage 1: build the jar with Maven ──────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy just the POM first so dependency downloads are cached across builds
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ─── Stage 2: slim runtime image ────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render sets $PORT at runtime; application.properties already reads it
# via server.port=${PORT:8080}, so no hardcoded port here.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
