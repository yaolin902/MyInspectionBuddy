import React from 'react';
import { StyleSheet, Text, View, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CAEntityResultsScreen = ({ route }) => {
    const { results } = route.params;
    console.log("Rendering results:", results); // Log the results to verify

    const renderItem = ({ item }) => (
        <View style={styles.row}>
            <Text style={styles.cell}>{item.entityInformation}</Text>
            <Text style={styles.cell}>{item.initialFilingDate}</Text>
            <Text style={styles.cell}>{item.status}</Text>
            <Text style={styles.cell}>{item.entityType}</Text>
            <Text style={styles.cell}>{item.formedIn}</Text>
            <Text style={styles.cell}>{item.agent}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>CA Business Entity Results</Text>
            {results.length === 0 ? (
                <Text>No results found.</Text>
            ) : (
                <View style={styles.table}>
                    <View style={styles.headerRow}>
                        <Text style={styles.headerCell}>Entity Information</Text>
                        <Text style={styles.headerCell}>Initial Filing Date</Text>
                        <Text style={styles.headerCell}>Status</Text>
                        <Text style={styles.headerCell}>Entity Type</Text>
                        <Text style={styles.headerCell}>Formed In</Text>
                        <Text style={styles.headerCell}>Agent</Text>
                    </View>
                    <FlatList
                        data={results}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            )}
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
    table: {
        borderWidth: 1,
        borderColor: '#ddd',
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f1f1',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    headerCell: {
        flex: 1,
        padding: 10,
        fontWeight: 'bold',
    },
    cell: {
        flex: 1,
        padding: 10,
    },
});

export default CAEntityResultsScreen;
