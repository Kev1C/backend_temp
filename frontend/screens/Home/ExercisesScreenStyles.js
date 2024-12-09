// frontend/screens/Home/ExercisesScreenStyles.js

import { StyleSheet } from 'react-native';

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 5,
    },
    searchBar: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        marginRight: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        borderColor: theme.colors.border,
    },
    filterButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: theme.colors.primary,
        opacity: 0.9,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    itemContainer: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
    },
    image: {
        width: '100%',
        height: 200,
        marginBottom: 10,
        borderRadius: 10,
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
    },
    imagePlaceholderText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    description: {
        marginTop: 5,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    link: {
        marginTop: 5,
        textDecorationLine: 'underline',
        color: theme.colors.primary,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    list: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent backdrop for better UX
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderRadius: 10,
        padding: 20,
        maxHeight: '80%',
        width: '90%', // Adjust as needed
        // Optional: Add shadow or elevation for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: theme.colors.text,
    },
    modalLabel: {
        fontSize: 16,
        marginTop: 10,
        color: theme.colors.text,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 10,
        borderColor: theme.colors.border,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 5,
    },
    detailImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    detailDescription: {
        fontSize: 14,
        marginBottom: 10,
        color: theme.colors.textSecondary,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        color: theme.colors.text,
    },
    detailText: {
        fontSize: 14,
        marginBottom: 10,
        color: theme.colors.text,
    },
    genderButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    genderButton: {
        flex: 1,
        marginHorizontal: 10,
        paddingVertical: 10,
    },
    closeButton: {
        marginTop: 20,
    },
    multiSelect: {
        marginTop: 5,
        marginBottom: 10,
    },
    multiSelectDropdown: {
        borderColor: theme.colors.border,
    },
});

export default createStyles;