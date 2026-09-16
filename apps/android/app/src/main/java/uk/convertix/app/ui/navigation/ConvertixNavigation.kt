package uk.convertix.app.ui.navigation

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Build
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.SwapHoriz
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

enum class ConvertixDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
) {
    Convert("convert", "Convert", Icons.Rounded.SwapHoriz),
    Tools("tools", "Tools", Icons.Rounded.Build),
    Activity("activity", "Activity", Icons.Rounded.History),
}

@Composable
fun ConvertixBottomBar(
    selectedRoute: String,
    onDestinationSelected: (ConvertixDestination) -> Unit,
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp,
        windowInsets = WindowInsets.navigationBars,
    ) {
        ConvertixDestination.entries.forEach { destination ->
            NavigationBarItem(
                selected = selectedRoute == destination.route,
                onClick = { onDestinationSelected(destination) },
                icon = { Icon(destination.icon, contentDescription = null) },
                label = { Text(destination.label) },
            )
        }
    }
}

@Composable
fun ConvertixNavigationRail(
    selectedRoute: String,
    onDestinationSelected: (ConvertixDestination) -> Unit,
) {
    NavigationRail(
        modifier = Modifier
            .fillMaxHeight()
            .windowInsetsPadding(WindowInsets.statusBars)
            .windowInsetsPadding(WindowInsets.navigationBars),
        containerColor = MaterialTheme.colorScheme.surface,
        header = {
            ConvertixBrand(compact = true)
            Spacer(Modifier.height(28.dp))
        },
    ) {
        ConvertixDestination.entries.forEach { destination ->
            NavigationRailItem(
                selected = selectedRoute == destination.route,
                onClick = { onDestinationSelected(destination) },
                icon = { Icon(destination.icon, contentDescription = null) },
                label = { Text(destination.label) },
            )
        }
    }
}

@Composable
fun ConvertixBrand(
    modifier: Modifier = Modifier,
    compact: Boolean = false,
) {
    Row(
        modifier = modifier.semantics { contentDescription = "Convertix" },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        ConvertixMark(modifier = Modifier.size(if (compact) 30.dp else 34.dp))
        if (!compact) {
            Text(
                text = "Convertix",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
        }
    }
}

@Composable
private fun ConvertixMark(modifier: Modifier = Modifier) {
    val primary = MaterialTheme.colorScheme.primary
    Canvas(modifier = modifier) {
        val strokeWidth = size.width * 0.17f

        fun drawChevron(startX: Float, alpha: Float) {
            val path = Path().apply {
                moveTo(startX, size.height * 0.20f)
                lineTo(startX + size.width * 0.30f, size.height * 0.50f)
                lineTo(startX, size.height * 0.80f)
            }
            drawPath(
                path = path,
                color = primary.copy(alpha = alpha),
                style = Stroke(
                    width = strokeWidth,
                    cap = androidx.compose.ui.graphics.StrokeCap.Round,
                    join = androidx.compose.ui.graphics.StrokeJoin.Round,
                ),
            )
        }

        drawChevron(size.width * 0.15f, 1f)
        drawChevron(size.width * 0.53f, 0.42f)
    }
}
