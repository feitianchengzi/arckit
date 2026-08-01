import SwiftUI

enum DesignTokens {
    enum Colors {
        static let background = Color("Background")
        static let surface = Color("Surface")
        static let textPrimary = Color("TextPrimary")
        static let textSecondary = Color("TextSecondary")
        static let accent = Color.accentColor
        static let error = Color("Error")
    }

    enum Typography {
        static let body = Font.body
        static let headline = Font.headline
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
    }

    enum Radius {
        static let sm: CGFloat = 6
        static let md: CGFloat = 8
    }
}
