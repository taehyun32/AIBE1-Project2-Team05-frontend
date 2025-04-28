module.exports = {
    content: [
        "./public/**/*.html",  // 모든 HTML 파일을 스캔합니다
        "./js/**/*.js"  // JavaScript 파일도 스캔합니다
    ],
    darkMode: false, // 'media' or 'class' or boolean
    theme: {
        extend: {
            colors: {
                primary: "#4F46E5",
                secondary: "#10B981",
                kakao: "#FEE500",
                naver: "#03C75A",
                google: "#FFFFFF",
            },
            borderRadius: {
                none: "0px",
                sm: "4px",
                DEFAULT: "8px",
                md: "12px",
                lg: "16px",
                xl: "20px",
                "2xl": "24px",
                "3xl": "32px",
                full: "9999px",
                button: "8px",
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
};
