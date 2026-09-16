package uk.convertix.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val Cobalt = Color(0xFF315CF5)
val CobaltDark = Color(0xFF2147D4)
val CobaltSoft = Color(0xFFE8EEFF)
val Ink950 = Color(0xFF0D1B34)
val Ink650 = Color(0xFF465575)
val Canvas = Color(0xFFF7F9FC)
val MineralWhite = Color(0xFFFFFFFF)
val Line = Color(0xFFDBE2EF)
val LineStrong = Color(0xFFC8D3E6)

private val LightColors = lightColorScheme(
    primary = Cobalt,
    onPrimary = Color.White,
    primaryContainer = CobaltSoft,
    onPrimaryContainer = CobaltDark,
    secondary = CobaltDark,
    onSecondary = Color.White,
    secondaryContainer = CobaltSoft,
    onSecondaryContainer = CobaltDark,
    background = Canvas,
    onBackground = Ink950,
    surface = MineralWhite,
    onSurface = Ink950,
    surfaceVariant = Color(0xFFF0F3F8),
    onSurfaceVariant = Ink650,
    outline = LineStrong,
    outlineVariant = Line,
    error = Color(0xFFB4233D),
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFFAEC1FF),
    onPrimary = Color(0xFF082A88),
    primaryContainer = Color(0xFF183B9F),
    onPrimaryContainer = Color(0xFFDCE4FF),
    secondary = Color(0xFFAEC1FF),
    onSecondary = Color(0xFF082A88),
    secondaryContainer = Color(0xFF183B9F),
    onSecondaryContainer = Color(0xFFDCE4FF),
    background = Color(0xFF09111F),
    onBackground = Color(0xFFF0F4FF),
    surface = Color(0xFF111B2E),
    onSurface = Color(0xFFF0F4FF),
    surfaceVariant = Color(0xFF18243A),
    onSurfaceVariant = Color(0xFFBCC7DC),
    outline = Color(0xFF73809A),
    outlineVariant = Color(0xFF2D3A52),
    error = Color(0xFFFFB2BD),
)

private val ConvertixTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 40.sp,
        lineHeight = 43.sp,
        letterSpacing = (-1.1).sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        letterSpacing = (-0.3).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 21.sp,
        lineHeight = 27.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 17.sp,
        lineHeight = 23.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 21.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
)

private val ConvertixShapes = Shapes(
    extraSmall = RoundedCornerShape(7.dp),
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(18.dp),
    extraLarge = RoundedCornerShape(24.dp),
)

@Composable
fun ConvertixTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = ConvertixTypography,
        shapes = ConvertixShapes,
        content = content,
    )
}
