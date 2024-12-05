import React from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const OpenHistoricalResultsScreen = ({ route }) => {
    const { results } = route.params;
    console.log("Rendering results:", results); // Log the results to verify

    if (!results || results.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Open Historical Results</Text>
                <Text>No results found.</Text>
            </View>
        );
    }

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <Text style={styles.cell}>Document Type: {item.doc_type}</Text>
            <Text style={styles.cell}>Year: {item.year}</Text>
            <Text style={styles.cell}>Number of Pages: {item.num_of_pages}</Text>
            <Text style={styles.cell}>Text: {item.text}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Open Historical Results</Text>
            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'column',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 10,
    },
    cell: {
        flex: 1,
        padding: 10,
    },
});

export default OpenHistoricalResultsScreen;
