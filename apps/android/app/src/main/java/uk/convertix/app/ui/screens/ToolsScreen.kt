package uk.convertix.app.ui.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Collections
import androidx.compose.material.icons.rounded.PictureAsPdf
import androidx.compose.material.icons.rounded.Scanner
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uk.convertix.app.ui.navigation.ConvertixBrand

private data class PlannedTool(
    val title: String,
    val description: String,
    val icon: ImageVector,
)

private val PlannedTools = listOf(
    PlannedTool("Scan to PDF", "Use the camera and Android document scanner.", Icons.Rounded.Scanner),
    PlannedTool("Merge PDFs", "Arrange documents into one PDF on your device.", Icons.Rounded.PictureAsPdf),
    PlannedTool("Compress images", "Prepare a batch of photos before sharing.", Icons.Rounded.Collections),
)

@Composable
fun ToolsScreen(expanded: Boolean) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .verticalScroll(rememberScrollState())
            .padding(
                horizontal = if (expanded) 40.dp else 20.dp,
                vertical = if (expanded) 32.dp else 20.dp,
            ),
    ) {
        ConvertixBrand()
        Spacer(Modifier.height(if (expanded) 46.dp else 32.dp))
        Text(
            text = "Tools built for Android",
            modifier = Modifier.semantics { heading() },
            style = if (expanded) MaterialTheme.typography.displaySmall else MaterialTheme.typography.headlineSmall,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "This space is ready for focused, device-native file tools.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(32.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.large,
            color = MaterialTheme.colorScheme.surface,
        ) {
            Column {
                PlannedTools.forEachIndexed { index, tool ->
                    ListItem(
                        headlineContent = { Text(tool.title, fontWeight = FontWeight.SemiBold) },
                        supportingContent = { Text(tool.description) },
                        leadingContent = {
                            Surface(
                                color = MaterialTheme.colorScheme.primaryContainer,
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Icon(
                                    imageVector = tool.icon,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                    modifier = Modifier.padding(12.dp).size(26.dp),
                                )
                            }
                        },
                        trailingContent = {
                            Surface(
                                color = MaterialTheme.colorScheme.surfaceVariant,
                                shape = RoundedCornerShape(7.dp),
                            ) {
                                Text(
                                    text = "Planned",
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 6.dp),
                                    style = MaterialTheme.typography.labelLarge,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        },
                    )
                    if (index != PlannedTools.lastIndex) {
                        HorizontalDivider(
                            modifier = Modifier.padding(start = 76.dp),
                            color = MaterialTheme.colorScheme.outlineVariant,
                        )
                    }
                }
            }
        }
    }
}
