package uk.convertix.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.FolderOpen
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import uk.convertix.app.ui.navigation.ConvertixBrand
import uk.convertix.app.ui.theme.ConvertixTheme

private val OutputFormats = listOf("PDF", "DOCX", "PNG", "JPG", "MP3", "MP4")

@Composable
fun ConvertScreen(
    expanded: Boolean,
    fileName: String?,
    fileDetail: String?,
    selectedOutput: String,
    onChooseFile: () -> Unit,
    onClearFile: () -> Unit,
    onOutputSelected: (String) -> Unit,
) {
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
        Spacer(Modifier.height(if (expanded) 46.dp else 24.dp))
        Text(
            text = "Convert a file",
            modifier = Modifier.semantics { heading() },
            style = if (expanded) MaterialTheme.typography.displaySmall else MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "Choose a file, pick an output, and you’re ready.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(if (expanded) 32.dp else 20.dp))

        if (expanded) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(28.dp),
                verticalAlignment = Alignment.Top,
            ) {
                FilePickerPanel(
                    fileName = fileName,
                    fileDetail = fileDetail,
                    onChooseFile = onChooseFile,
                    onClearFile = onClearFile,
                    modifier = Modifier.weight(1.08f),
                )
                ConversionRoute(
                    fileName = fileName,
                    selectedOutput = selectedOutput,
                    onChooseFile = onChooseFile,
                    onOutputSelected = onOutputSelected,
                    modifier = Modifier.weight(0.92f),
                )
            }
        } else {
            FilePickerPanel(
                fileName = fileName,
                fileDetail = fileDetail,
                onChooseFile = onChooseFile,
                onClearFile = onClearFile,
            )
            Spacer(Modifier.height(24.dp))
            ConversionRoute(
                fileName = fileName,
                selectedOutput = selectedOutput,
                onChooseFile = onChooseFile,
                onOutputSelected = onOutputSelected,
            )
        }
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun FilePickerPanel(
    fileName: String?,
    fileDetail: String?,
    onChooseFile: () -> Unit,
    onClearFile: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shape = RoundedCornerShape(18.dp)
    val outline = MaterialTheme.colorScheme.outline
    val surface = MaterialTheme.colorScheme.surface

    Box(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 204.dp)
            .clip(shape)
            .background(surface)
            .drawBehind {
                drawRoundRect(
                    color = outline,
                    topLeft = Offset(1.dp.toPx(), 1.dp.toPx()),
                    size = Size(size.width - 2.dp.toPx(), size.height - 2.dp.toPx()),
                    cornerRadius = CornerRadius(18.dp.toPx()),
                    style = Stroke(
                        width = 1.5.dp.toPx(),
                        pathEffect = PathEffect.dashPathEffect(
                            floatArrayOf(8.dp.toPx(), 7.dp.toPx()),
                        ),
                    ),
                )
            }
            .clickable(role = Role.Button, onClick = onChooseFile)
            .padding(20.dp),
        contentAlignment = Alignment.Center,
    ) {
        if (fileName == null) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(14.dp),
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Description,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.padding(16.dp).size(38.dp),
                    )
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = onChooseFile,
                    modifier = Modifier.heightIn(min = 52.dp),
                ) {
                    Icon(Icons.Rounded.FolderOpen, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("Choose file")
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    text = "Select a file from your device",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Description,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.padding(14.dp).size(30.dp),
                        )
                    }
                    Spacer(Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = fileName,
                            style = MaterialTheme.typography.titleMedium,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = fileDetail.orEmpty(),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    IconButton(onClick = onClearFile) {
                        Icon(Icons.Rounded.Close, contentDescription = "Remove selected file")
                    }
                }
                Spacer(Modifier.height(24.dp))
                Text(
                    text = "Ready to choose an output format.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(12.dp))
                TextButton(onClick = onChooseFile) {
                    Icon(Icons.Rounded.Refresh, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Choose a different file")
                }
            }
        }
    }
}

@Composable
private fun ConversionRoute(
    fileName: String?,
    selectedOutput: String,
    onChooseFile: () -> Unit,
    onOutputSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        RouteStep(
            number = 1,
            active = true,
            title = if (fileName == null) "Choose a file" else "File selected",
            supporting = fileName ?: "Pick a file from your device.",
            showConnector = true,
            onClick = onChooseFile,
        )
        RouteStep(
            number = 2,
            active = fileName != null,
            title = "Select output format",
            supporting = if (fileName == null) "Choose a file first." else "Choose the format you want.",
            showConnector = true,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutputFormats.forEach { format ->
                    FilterChip(
                        selected = selectedOutput == format,
                        onClick = { onOutputSelected(format) },
                        enabled = fileName != null,
                        label = { Text(format) },
                    )
                }
            }
        }
        RouteStep(
            number = 3,
            active = false,
            title = "Convert file",
            supporting = "Conversion service isn’t connected yet.",
            showConnector = false,
        ) {
            Button(
                onClick = {},
                enabled = false,
                modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp),
            ) {
                Icon(Icons.Rounded.SwapHoriz, contentDescription = null)
                Spacer(Modifier.width(10.dp))
                Text("Convert file")
            }
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Outlined.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "Conversion service isn’t connected yet.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun RouteStep(
    number: Int,
    active: Boolean,
    title: String,
    supporting: String,
    showConnector: Boolean,
    onClick: (() -> Unit)? = null,
    content: (@Composable () -> Unit)? = null,
) {
    val connectorColor = MaterialTheme.colorScheme.outlineVariant
    Row(modifier = Modifier.fillMaxWidth()) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(
                        if (active) MaterialTheme.colorScheme.primary
                        else MaterialTheme.colorScheme.surfaceVariant,
                    )
                    .border(
                        width = 1.dp,
                        color = if (active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                        shape = CircleShape,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = number.toString(),
                    style = MaterialTheme.typography.labelLarge,
                    color = if (active) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (showConnector) {
                Canvas(modifier = Modifier.width(2.dp).height(if (content == null) 46.dp else 100.dp)) {
                    drawLine(
                        color = connectorColor,
                        start = Offset(size.width / 2, 0f),
                        end = Offset(size.width / 2, size.height),
                        strokeWidth = 2.dp.toPx(),
                    )
                }
            }
        }
        Spacer(Modifier.width(16.dp))
        Column(
            modifier = Modifier
                .weight(1f)
                .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
                .padding(top = 6.dp, bottom = if (showConnector) 20.dp else 0.dp),
        ) {
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(3.dp))
            Text(
                text = supporting,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            if (content != null) {
                Spacer(Modifier.height(12.dp))
                content()
            }
        }
    }
}

@Preview(showBackground = true, widthDp = 412, heightDp = 915)
@Composable
private fun ConvertScreenPreview() {
    ConvertixTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            ConvertScreen(
                expanded = false,
                fileName = null,
                fileDetail = null,
                selectedOutput = "PDF",
                onChooseFile = {},
                onClearFile = {},
                onOutputSelected = {},
            )
        }
    }
}

@Preview(showBackground = true, widthDp = 1100, heightDp = 760)
@Composable
private fun ConvertScreenTabletPreview() {
    ConvertixTheme {
        Surface(color = MaterialTheme.colorScheme.background) {
            ConvertScreen(
                expanded = true,
                fileName = "Quarterly-report.docx",
                fileDetail = "DOCX · 2.4 MB",
                selectedOutput = "PDF",
                onChooseFile = {},
                onClearFile = {},
                onOutputSelected = {},
            )
        }
    }
}
