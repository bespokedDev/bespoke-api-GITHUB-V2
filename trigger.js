// =========================================================
//  VARIABLES DE CONFIGURACIÓN
// =========================================================
const CLUSTER_NAME = "sqnommel";
const GMAIL_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAI2aV1eg/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=K0K3hY464Q3xE2c_JHRrLDGiQFF78g6cvMDogTcVUIY";
const SOURCE_INFO = "MongoDB Atlas Backup Trigger";

// Configuración de Bitbucket
const BITBUCKET_REPO_OWNER = "StarQuantix"; // REEMPLAZAR con tu usuario
const BITBUCKET_REPO_SLUG = "search_indexes_backups";
const BITBUCKET_BRANCH = "main";

// Define las bases de datos de las que se extraerán los índices
const DATABASES_TO_BACKUP = ["test_juris", "dev_juris", "prod_juris"];
const MAX_ERRORS_TO_REPORT = 10;

// =========================================================
//  LÓGICA PRINCIPAL DE LA FUNCIÓN
// =========================================================
exports = async function() {
  const cluster = context.services.get(CLUSTER_NAME);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getFullYear()}`;
  const errors = [];
  const successResults = [];
  const backupFiles = [];

  try {
    // Obtener API Token de Bitbucket desde los values de Atlas
    const apiToken = context.values.get("bitbucketApiToken");
    
    // Debug: Mostrar qué values están disponibles
    console.log("______________", apiToken.token)
    console.log("Values disponibles en Atlas:", Object.keys(context.values));
    console.log("API Token encontrado:", apiToken.token ? "SÍ" : "NO");
    
    if (!apiToken.token) {
      throw new Error("API Token de Bitbucket no configurado en los values de Atlas");
    }

    if (apiToken.token.length < 20) {
      throw new Error("API Token parece ser inválido (muy corto)");
    }

    const authHeader = `Bearer ${apiToken.token}`;
    console.log("Header de autorización configurado correctamente");

    for (const dbName of DATABASES_TO_BACKUP) {
      try {
        const db = cluster.db(dbName);
        const collectionNames = await db.getCollectionNames();
        let dbInfo = {
          database: dbName,
          totalCollections: collectionNames.length,
          collections: [],
          systemCollections: 0,
          userCollections: 0,
          searchIndexes: []
        };

        for (const collName of collectionNames) {
          if (collName.startsWith("system.")) {
            console.log(`Saltando colección del sistema: '${collName}'`);
            dbInfo.systemCollections++;
            continue;
          }

          dbInfo.userCollections++;
          dbInfo.collections.push(collName);

          try {
            // Intentar obtener índices de búsqueda
            const collection = db.collection(collName);
            
            try {
              // Usar $listSearchIndexes si está disponible
              const searchIndexes = await collection.aggregate([
                { $listSearchIndexes: {} }
              ]).toArray();
              
              if (searchIndexes && searchIndexes.length > 0) {
                console.log(`Índices encontrados en ${collName}: ${searchIndexes.length}`);
                dbInfo.searchIndexes.push({
                  collection: collName,
                  indexes: searchIndexes
                });
              }
            } catch (indexError) {
              // Si $listSearchIndexes falla, continuar sin errores
              console.log(`No se pudieron obtener índices de búsqueda para ${collName}: ${indexError.message}`);
            }
            
          } catch (e) {
            console.error(`Error al procesar la colección '${collName}': ${e.message}`);
            if (errors.length < MAX_ERRORS_TO_REPORT) {
              errors.push({ db: dbName, collection: collName, reason: e.message });
            }
          }
        }
        
        // Crear archivo de backup para esta DB
        if (dbInfo.searchIndexes.length > 0) {
          const fileName = `backup_search_index_${dbName}_${formattedDate}.json`;
          const fileContent = JSON.stringify({
            database: dbName,
            backupDate: now.toISOString(),
            totalCollections: dbInfo.userCollections,
            collectionsWithIndexes: dbInfo.searchIndexes.length,
            searchIndexes: dbInfo.searchIndexes
          }, null, 2);

          backupFiles.push({
            fileName: fileName,
            content: fileContent,
            database: dbName
          });

          console.log(`Archivo de backup creado para ${dbName}: ${fileName}`);
        }
        
        successResults.push(dbInfo);
        console.log(`DB ${dbName} procesada exitosamente. Colecciones: ${dbInfo.userCollections}, Índices: ${dbInfo.searchIndexes.length}`);
        
      } catch (e) {
        console.error(`Error al procesar DB ${dbName}: `, e.message);
        errors.push({ db: dbName, reason: e.message });
      }
    }

    // Subir archivos a Bitbucket
    if (backupFiles.length > 0) {
      console.log(`Subiendo ${backupFiles.length} archivos a Bitbucket...`);
      console.log(`URL de la API: https://api.bitbucket.org/2.0/repositories/${BITBUCKET_REPO_OWNER}/${BITBUCKET_REPO_SLUG}/src`);
      
      for (const backupFile of backupFiles) {
        try {
          const bitbucketApiUrl = `https://api.bitbucket.org/2.0/repositories/${BITBUCKET_REPO_OWNER}/${BITBUCKET_REPO_SLUG}/src`;
          
          // Estructura correcta del payload según la documentación oficial de Bitbucket
          const payload = {
            message: `Backup automático de índices de búsqueda para ${backupFile.database} - ${formattedDate}`,
            author: `Atlas Trigger <noreply@mongodb.com>`,
            branch: BITBUCKET_BRANCH,
            files: {
              [backupFile.fileName]: backupFile.content
            }
          };

          console.log(`Intentando subir ${backupFile.fileName}...`);
          
          const response = await context.http.post({
            url: bitbucketApiUrl,
            headers: { 
              "Authorization": [authHeader],
              "Content-Type": ["application/json"]
            },
            body: JSON.stringify(payload)
          });

          console.log(`Respuesta de Bitbucket para ${backupFile.fileName}:`, response.status, response.statusText);

          if (response.status === 201) {
            console.log(`✅ Archivo ${backupFile.fileName} subido exitosamente a Bitbucket`);
          } else {
            console.error(`❌ Error al subir ${backupFile.fileName}: ${response.status} ${response.statusText}`);
            
            // Intentar obtener más detalles del error
            let errorDetails = "";
            try {
              const responseBody = JSON.parse(response.body.text());
              errorDetails = responseBody.error ? responseBody.error.message : "Sin detalles adicionales";
              console.log(`Detalles del error de Bitbucket:`, responseBody);
            } catch (e) {
              errorDetails = "No se pudo parsear la respuesta de error";
            }
            
            errors.push({ 
              db: backupFile.database, 
              reason: `Error HTTP ${response.status}: ${errorDetails}` 
            });
          }
          
        } catch (e) {
          console.error(`Error al subir ${backupFile.fileName}: ${e.message}`);
          errors.push({ 
            db: backupFile.database, 
            reason: `Error de conexión: ${e.message}` 
          });
        }
      }
    } else {
      console.log("No se encontraron índices de búsqueda para hacer backup");
    }

  } catch (e) {
    console.error("Error crítico en la función de backup: ", e.message);
    errors.push({ db: 'N/A', reason: `Fallo general: ${e.message}` });
  }

  // Preparar mensaje de resumen
  let summaryMessage = `📊 **BACKUP DE ÍNDICES DE BÚSQUEDA - ${formattedDate}** 📊\n`;
  summaryMessage += `Fuente: **${SOURCE_INFO}** en el clúster **\`${CLUSTER_NAME}\`**.\n\n`;
  
  if (successResults.length > 0) {
    summaryMessage += `✅ **Bases de datos procesadas:**\n\n`;
    successResults.forEach(result => {
      summaryMessage += `• **${result.database}**: ${result.userCollections} colecciones, ${result.searchIndexes.length} con índices\n`;
    });
    summaryMessage += `\n`;
  }

  if (backupFiles.length > 0) {
    summaryMessage += `💾 **Archivos de backup creados:**\n\n`;
    backupFiles.forEach(file => {
      summaryMessage += `• \`${file.fileName}\` (${file.database})\n`;
    });
    summaryMessage += `\n`;
  }

  if (errors.length > 0) {
    summaryMessage += `❌ **Errores encontrados:**\n\n`;
    errors.forEach(err => {
      if (err.collection) {
        summaryMessage += `• DB: **\`${err.db}\`** | Colección: **\`${err.collection}\`**\n`;
      } else {
        summaryMessage += `• DB: **\`${err.db}\`**\n`;
      }
      summaryMessage += `  Motivo: **${err.reason}**\n`;
    });
  } else {
    summaryMessage += `🎉 **Backup completado exitosamente.**\n`;
  }

  // Enviar resumen a Google Chat
  try {
    await context.http.post({
      url: GMAIL_WEBHOOK_URL,
      body: JSON.stringify({ text: summaryMessage }),
      headers: { "Content-Type": ["application/json"] }
    });
    console.log("Resumen enviado a Google Chat exitosamente.");
  } catch (e) {
    console.error("Error al enviar resumen a Google Chat: ", e.message);
  }

  // Retornar resumen
  return {
    success: errors.length === 0,
    databasesProcessed: successResults.length,
    totalErrors: errors.length,
    backupFilesCreated: backupFiles.length,
    summary: summaryMessage,
    details: {
      success: successResults,
      backupFiles: backupFiles.map(f => ({ fileName: f.fileName, database: f.database })),
      errors: errors
    }
  };
};