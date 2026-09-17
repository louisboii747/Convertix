import SwiftUI
import WidgetKit

@main
struct ConvertixWidgetBundle: WidgetBundle {
    var body: some Widget {
        ConvertixWidget()
        ConversionLiveActivity()
    }
}
