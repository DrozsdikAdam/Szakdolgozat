package hu.mes.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseDialectConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(
            @Value("${HIBERNATE_PREFERRED_UUID_JDBC_TYPE:}") String explicitUuidType,
            Environment env) {
        return properties -> {
            if (explicitUuidType != null && !explicitUuidType.isBlank() && !explicitUuidType.equalsIgnoreCase("AUTO")) {
                properties.put("hibernate.type.preferred_uuid_jdbc_type", explicitUuidType.trim());
                return;
            }

            String url = env.getProperty("spring.datasource.url", "").toLowerCase();
            String driver = env.getProperty("spring.datasource.driver-class-name", "").toLowerCase();
            String engine = env.getProperty("DB_ENGINE", "").toLowerCase();

            if (url.contains("oracle") || driver.contains("oracle") || engine.equals("oracle")
                    || url.contains("sqlserver") || driver.contains("sqlserver") || engine.equals("mssql")) {
                properties.put("hibernate.type.preferred_uuid_jdbc_type", "CHAR");
            } else {
                properties.put("hibernate.type.preferred_uuid_jdbc_type", "UUID");
            }
        };
    }
}
