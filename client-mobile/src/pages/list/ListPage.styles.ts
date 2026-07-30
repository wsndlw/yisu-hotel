import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        marginTop: 44
    },
    backBtn: {
        marginRight: 8
    },
    capsule: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
        height: 36,
    },
    capsuleCity: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333'
    },
    capsuleDivider: {
        width: 1,
        height: 14,
        backgroundColor: '#ccc',
        marginHorizontal: 6
    },
    capsuleDate: {
        fontSize: 10,
        color: '#333',
        lineHeight: 11
    },
    capsuleNights: {
        fontSize: 10,
        color: '#0086F6',
        fontWeight: 'bold',
        lineHeight: 11
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        borderRadius: 18,
        height: 36,
        paddingHorizontal: 10
    },
    input: {
        flex: 1,
        fontSize: 13,
        color: '#333',
        marginLeft: 6
    },
    mapIconBtn: {
        alignItems: 'center',
        marginLeft: 10
    },
    mapText: {
        fontSize: 10,
        color: '#0086F6'
    },
    filterBar: {
        flexDirection: 'row',
        height: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderColor: '#eee'
    },
    filterItem: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    filterText: {
        fontSize: 13,
        color: '#333',
        marginRight: 4
    },
    activeText: {
        color: '#0086F6',
        fontWeight: 'bold'
    },
    quickTagsContainer: {
        paddingHorizontal: 12,
        alignItems: 'center'
    },
    quickTag: {
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        marginRight: 8
    },
    quickTagActive: {
        backgroundColor: '#E6F4FF'
    },
    quickTagText: {
        fontSize: 12,
        color: '#666'
    },
    quickTagTextActive: {
        color: '#0086F6',
        fontWeight: 'bold'
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 10
    },
    imageWrapper: {
        width: 110,
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative'
    },
    cardImg: {
        width: '100%',
        height: '100%'
    },
    playIcon: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cardInfo: {
        flex: 1,
        marginLeft: 10,
        justifyContent: 'space-between'
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    cardName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 4,
        maxWidth: '70%'
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 2
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    scoreBadge: {
        backgroundColor: '#0086F6',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginRight: 4
    },
    scoreText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    scoreDesc: {
        color: '#0086F6',
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 6
    },
    commentText: {
        color: '#666',
        fontSize: 11
    },
    locationText: {
        color: '#999',
        fontSize: 11,
        marginTop: 4
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 6
    },
    tagContainer: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 4,
        marginBottom: 4
    },
    tagText: {
        fontSize: 10

    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        marginTop: 8
    },
    vipTag: {
        borderWidth: 0.5,
        borderColor: '#0086F6',
        borderRadius: 2,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginRight: 8,
        marginBottom: 4,
        backgroundColor: '#F0F8FF'
    },
    vipText: {
        fontSize: 10,
        color: '#0086F6',
        fontWeight: '500'
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },
    currency: {
        color: '#0086F6',
        fontSize: 12,
        marginBottom: 3,
        fontWeight: 'bold'
    },
    price: {
        color: '#0086F6',
        fontSize: 20,
        fontWeight: 'bold',
        lineHeight: 22
    },
    qi: {
        color: '#999',
        fontSize: 10,
        marginBottom: 3,
        marginLeft: 1
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContentTop: {
        backgroundColor: '#fff',
        marginTop: 128,
        marginHorizontal: 0,
        padding: 10,
        borderRadius: 8
    },
    sortOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderColor: '#eee',
        paddingHorizontal: 20
    },
    sortText: {
        fontSize: 14,
        color: '#333'
    },
    filterModalContent: {
        backgroundColor: '#fff',
        height: '70%',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        borderBottomWidth: 0.5,
        borderColor: '#eee'
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    closeBtn: {
        position: 'absolute',
        right: 15
    },
    filterScroll: {
        flex: 1
    },
    filterSection: {
        padding: 15
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    filterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    filterChip: {
        width: '30%',
        backgroundColor: '#f5f7fa',
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 4,
        marginBottom: 10,
        marginRight: '3%'
    },
    filterChipActive: {
        backgroundColor: '#E6F4FF'
    },
    filterChipText: {
        fontSize: 12,
        color: '#666'
    },
    filterChipTextActive: {
        color: '#0086F6'
    },
    filterFooter: {
        flexDirection: 'row',
        height: 60,
        borderTopWidth: 0.5,
        borderColor: '#eee',
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    resetBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd'
    },
    resetText: {
        color: '#666'
    },
    confirmBtn: {
        flex: 2,
        alignItems: 'center',
        backgroundColor: '#0086F6',
        paddingVertical: 10,
        borderRadius: 20
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold'
    },
});

export default styles;
