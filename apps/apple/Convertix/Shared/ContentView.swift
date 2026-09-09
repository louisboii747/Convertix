import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                Text("Convertix")
                    .font(.largeTitle.bold())
                Text("Native app foundation")
                    .foregroundStyle(.secondary)
            }
            .padding()
            .navigationTitle("Convertix")
        }
    }
}

#Preview {
    ContentView()
}
