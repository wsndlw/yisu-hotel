import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const SWIPER_HEIGHT = 260;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    scrollContent: {
        paddingBottom: 20
    },
    wrapper: {
        height: SWIPER_HEIGHT,
        width: '100%'
    },
    carousel: {
        height: SWIPER_HEIGHT,
        width: '100%',
        backgroundColor: '#eee'
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent'
    },
    image: {
        width: width,
        height: SWIPER_HEIGHT
    },

    // Search Card
    searchCard: {
        marginHorizontal: 12,
        marginTop: -40
    },
    bookmarkWrapper: {
        flexDirection: 'row',
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        overflow: 'hidden'
    },
    bookmarkItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    bookmarkActive: {
        backgroundColor: '#fff'
    },
    tabText: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#0086F6',
        fontWeight: 'bold',
        fontSize: 17
    },
    activeLine: {
        position: 'absolute',
        bottom: -6,
        left: '20%',
        width: '60%',
        height: 3,
        backgroundColor: '#0086F6',
        borderRadius: 2
    },

    // Card Content
    cardContent: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        padding: 16,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3
    },

    // Search Row
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15
    },
    citySelector: {
        marginRight: 15,
        minWidth: 70
    },
    cityText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    inputWrapper: {
        flex: 1,
        height: 40,
        justifyContent: 'center'
    },
    searchInput: {
        fontSize: 16,
        color: '#333'
    },
    bubbleContainer: {
        position: 'absolute',
        top: -22.5, // 向上浮动
        left: 0,
        zIndex: 10,
    },
    bubble: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
    },
    bubbleText: {
        color: '#fff',
        fontSize: 12,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderBottomWidth: 0,
        borderTopWidth: 6,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(0,0,0,0.7)',
        marginLeft: 10, // 调整小三角的位置
    },
    mapIconBtn: {
        alignItems: 'center',
        marginLeft: 10
    },
    mapText: {
        fontSize: 10,
        color: '#0086F6'
    },

    // Date Row
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    dateMainText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    dateDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#ddd',
        marginHorizontal: 8
    },
    nightCountText: {
        fontSize: 14,
        color: '#333',
        marginRight: 4
    },

    // Price Row
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18
    },
    priceRowText: {
        fontSize: 18,
        color: '#ccc',
        fontWeight: '500'
    },

    // Tags
    quickTagsWrapper: {
        marginTop: 0,
        marginBottom: 10
    },
    tagItem: {
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    tagItemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#0086F6'
    },
    tagText: {
        color: '#333',
        fontSize: 13
    },
    tagTextSelected: {
        color: '#0086F6',
        fontWeight: 'bold'
    },

    // Button
    searchBtn: {
        backgroundColor: '#0086F6',
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#0086F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    searchBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '50%'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    gridItem: {
        width: '30%',
        backgroundColor: '#f5f7fa',
        paddingVertical: 10,
        borderRadius: 6,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    gridItemSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#0086F6',
        borderWidth: 1
    },
    gridText: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center'
    },
    gridSubText: {
        fontSize: 11,
        color: '#999',
        marginTop: 2
    },
    gridTextSelected: {
        color: '#0086F6',
        fontWeight: 'bold'
    },
    filterFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee'
    },
    resetBtn: {
        flex: 1,
        marginRight: 10,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    resetBtnText: {
        color: '#333',
        fontSize: 16
    },
    okBtn: {
        flex: 2,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0086F6',
        justifyContent: 'center',
        alignItems: 'center'
    },
    okBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },

    bottomSection: {
        padding: 20,
        paddingTop: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },

    // 大图卡片
    specialMainCard: {
        height: 140,
        borderRadius: 16, // 圆角
        overflow: 'hidden',
        marginBottom: 15,
        position: 'relative', // 用于定位蒙层
        backgroundColor: '#f0f0f0', // 加载时的底色
    },
    specialMainImage: {
        width: '100%',
        height: '100%',
    },
    specialImageOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.25)', // 轻微的黑色半透明蒙层，让文字更清晰
        padding: 16,
        justifyContent: 'space-between',
    },
    specialTag: {
        backgroundColor: '#FF4D4F',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    specialTagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    specialOverlayText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // 三个小框容器
    threeBoxesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // 单个小框
    smallBox: {
        flex: 1,
        height: 110, // 固定高度
        borderRadius: 16, // 圆角
        padding: 12,
        marginHorizontal: 5, // 框之间的间距
        justifyContent: 'center',
        //alignItems: 'center', // 居中对齐
        position: 'relative',
        overflow: 'hidden',
    },
    // 小框的装饰性大图标
    boxDecorationIcon: {
        position: 'absolute',
        right: -15,
        bottom: -15,
        opacity: 0.15, // 非常淡的透明度
        transform: [{ rotate: '-15deg' }] //稍微倾斜一点
    },
    boxTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    boxSubtitle: {
        fontSize: 11,
        color: '#666',
    },

});

export default styles;
