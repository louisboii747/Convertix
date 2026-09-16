/*
 * THESIS: A focused conversion route makes the file task obvious; it refuses a generic dashboard-first home.
 * OWN-WORLD: Powder-blue canvas, mineral surfaces, deep navy type, cobalt actions, cool hairlines, and restrained depth.
 * STORY: Choose a local file, inspect its type, choose an output, then see honestly that cloud conversion is not connected.
 * FIRST VIEWPORT: Brand and task copy lead into one broad file target, followed by three connected steps and persistent navigation.
 * FORM: Responsive Android app shell; phone bottom bar, tablet rail, focused route composition; seed 8b261e30.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */
package uk.convertix.app.ui

import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uk.convertix.app.ui.navigation.ConvertixBottomBar
import uk.convertix.app.ui.navigation.ConvertixDestination
import uk.convertix.app.ui.navigation.ConvertixNavigationRail
import uk.convertix.app.ui.screens.ActivityScreen
import uk.convertix.app.ui.screens.ConvertScreen
import uk.convertix.app.ui.screens.ToolsScreen
import uk.convertix.app.ui.theme.ConvertixTheme
import java.util.Locale

@Composable
fun ConvertixApp() {
    ConvertixTheme {
        var currentRoute by rememberSaveable { mutableStateOf(ConvertixDestination.Convert.route) }
        var selectedUri by rememberSaveable { mutableStateOf<String?>(null) }
        var selectedFileName by rememberSaveable { mutableStateOf<String?>(null) }
        var selectedFileDetail by rememberSaveable { mutableStateOf<String?>(null) }
        var selectedOutput by rememberSaveable { mutableStateOf("PDF") }
        val context = LocalContext.current
        val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            uri?.let {
                val document = readDocumentSummary(context.contentResolver, it)
                selectedUri = it.toString()
                selectedFileName = document.name
                selectedFileDetail = document.detail
            }
        }

        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background,
        ) {
            BoxWithConstraints {
                val expanded = maxWidth >= 840.dp

                if (expanded) {
                    Row(modifier = Modifier.fillMaxSize()) {
                        ConvertixNavigationRail(
                            selectedRoute = currentRoute,
                            onDestinationSelected = { currentRoute = it.route },
                        )
                        DestinationContent(
                            route = currentRoute,
                            expanded = true,
                            fileName = selectedFileName,
                            fileDetail = selectedFileDetail,
                            output = selectedOutput,
                            onChooseFile = { picker.launch(arrayOf("*/*")) },
                            onClearFile = {
                                selectedUri = null
                                selectedFileName = null
                                selectedFileDetail = null
                            },
                            onOutputSelected = { selectedOutput = it },
                            modifier = Modifier.weight(1f),
                        )
                    }
                } else {
                    Scaffold(
                        containerColor = MaterialTheme.colorScheme.background,
                        contentWindowInsets = WindowInsets(0, 0, 0, 0),
                        bottomBar = {
                            ConvertixBottomBar(
                                selectedRoute = currentRoute,
                                onDestinationSelected = { currentRoute = it.route },
                            )
                        },
                    ) { innerPadding ->
                        DestinationContent(
                            route = currentRoute,
                            expanded = false,
                            fileName = selectedFileName,
                            fileDetail = selectedFileDetail,
                            output = selectedOutput,
                            onChooseFile = { picker.launch(arrayOf("*/*")) },
                            onClearFile = {
                                selectedUri = null
                                selectedFileName = null
                                selectedFileDetail = null
                            },
                            onOutputSelected = { selectedOutput = it },
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DestinationContent(
    route: String,
    expanded: Boolean,
    fileName: String?,
    fileDetail: String?,
    output: String,
    onChooseFile: () -> Unit,
    onClearFile: () -> Unit,
    onOutputSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier) {
        when (route) {
            ConvertixDestination.Tools.route -> ToolsScreen(expanded = expanded)
            ConvertixDestination.Activity.route -> ActivityScreen(expanded = expanded)
            else -> ConvertScreen(
                expanded = expanded,
                fileName = fileName,
                fileDetail = fileDetail,
                selectedOutput = output,
                onChooseFile = onChooseFile,
                onClearFile = onClearFile,
                onOutputSelected = onOutputSelected,
            )
        }
    }
}

private data class DocumentSummary(
    val name: String,
    val detail: String,
)

private fun readDocumentSummary(
    resolver: android.content.ContentResolver,
    uri: Uri,
): DocumentSummary {
    var displayName = uri.lastPathSegment?.substringAfterLast('/') ?: "Selected file"
    var size: Long? = null

    resolver.query(
        uri,
        arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE),
        null,
        null,
        null,
    )?.use { cursor ->
        if (cursor.moveToFirst()) {
            val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
            if (nameIndex >= 0) displayName = cursor.getString(nameIndex) ?: displayName
            if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) size = cursor.getLong(sizeIndex)
        }
    }

    val extension = displayName.substringAfterLast('.', "File").uppercase(Locale.getDefault())
    val sizeLabel = size?.let(::formatFileSize) ?: "Size unavailable"
    return DocumentSummary(displayName, "$extension · $sizeLabel")
}

private fun formatFileSize(bytes: Long): String = when {
    bytes < 1_024 -> "$bytes B"
    bytes < 1_048_576 -> "${bytes / 1_024} KB"
    else -> String.format(Locale.getDefault(), "%.1f MB", bytes / 1_048_576.0)
}
