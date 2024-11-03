import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CDPHResultsScreen = ({ route, navigation }) => {
    const { results } = route.params;
    console.log("Rendering results:", results); // Log the results to verify

    const renderPDF = (uri) => {
        navigation.navigate('PDFViewer', { uri });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>CDPH Recall Results</Text>
            {results.length === 0 ? (
                <Text>No results found.</Text>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <Text style={styles.title}>{item.text}</Text>
                            <TouchableOpacity onPress={() => renderPDF(item.url)}>
                                <Text style={styles.link}>View Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 5,
    },
    title: {
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    link: {
        color: 'blue',
        textDecorationLine: 'underline',
        marginTop: 10,
    },
    // Additional styles
});

export default CDPHResultsScreen;
