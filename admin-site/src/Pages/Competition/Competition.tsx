import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, FormControl, FormLabel, Heading, Input, Select, useToast } from "@chakra-ui/react";
import { getCompetitionInfo, importCompetition, syncCompetition, updateCompetition } from "../../logic/competition";
import { Competition as CompetitionInterface } from "../../logic/interfaces";
import events from "../../logic/events";
import { Activity, Event, Round } from "@wca/helpers";
import LoadingPage from "../../Components/LoadingPage";

const Competition = (): JSX.Element => {

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [competitionImported, setCompetitionImported] = useState<boolean>(false);
    const [competition, setCompetition] = useState<CompetitionInterface | null>(null);
    const [currentEvent, setCurrentEvent] = useState<string>("");
    const [currentRound, setCurrentRound] = useState<string>("");
    const idRef: React.RefObject<HTMLInputElement> = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const groups = useMemo(() => {
        if (!competition || !currentRound) {
            return [];
        }
        return competition.wcif.schedule.venues[0].rooms[0].activities.find((activity: Activity) => activity.activityCode === currentRound).childActivities;
    }, [competition, currentRound]);

    const fetchData = async () => {
        const response = await getCompetitionInfo();
        if (response.status === 200) {
            setCompetitionImported(true);
            setCompetition(response.data);
            if (response.data.currentGroupId) {
                const sliced = response.data.currentGroupId.split("-");
                setCurrentEvent(sliced[0]);
                setCurrentRound(sliced[0] + "-" + sliced[1]);
                console.log(sliced);
            }
        }
        else if (response.status === 404) {
            setCompetitionImported(false);
        }
        setIsLoading(false);
    };

    const handleImportCompetition = async () => {
        if (!idRef || !idRef.current || !idRef.current.value || idRef.current.value === "") {
            toast({
                title: "Error",
                description: "Please enter a competition ID",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
        const id = idRef.current?.value;
        if (!id) {
            return;
        }
        const response = await importCompetition(id);
        if (response.status === 200) {
            setCompetitionImported(true);
            setCompetition(response.data);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!competition) {
            return;
        }
        const status = await updateCompetition(competition.id, competition);
        if (status === 200) {
            toast({
                title: "Success",
                description: "Competition updated",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleSync = async () => {
        if (!competition || !competition.wcaId) {
            return;
        }
        const status = await syncCompetition(competition.wcaId);
        if (status === 200) {
            toast({
                title: "Success",
                description: "Competition synced",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }

    };

    useEffect(() => {
        fetchData();
    }, []);

    if (isLoading || (!competition && competitionImported)) {
        return <LoadingPage />;
    }

    if (!competitionImported) {
        return (
            <Box display="flex" flexDirection="column" gap="5">
                <Heading size="lg">Competition</Heading>
                <Box display="flex" flexDirection="column" gap="5" width="20%">
                    <Input placeholder="Competition ID" ref={idRef} />
                    <Button onClick={handleImportCompetition}>Import</Button>
                </Box>
            </Box>
        )
    }

    if (!competition) {
        return <LoadingPage />;
    }

    return (
        <Box display="flex" flexDirection="column" gap="5">
            <Heading size="lg">{competition?.name}</Heading>
            <Box display="flex" flexDirection="column" gap="5" width="20%">
                <Button colorScheme="yellow" onClick={handleSync}>Sync</Button>
            </Box>
            <Box display="flex" flexDirection="column" gap="5" width="20%" as="form" onSubmit={handleSubmit}>
                <FormControl>
                    <FormLabel>Scoretaking token</FormLabel>
                    <Input placeholder="Scoretaking token" _placeholder={{ color: "white" }} value={competition?.scoretakingToken} onChange={(event) => setCompetition({ ...competition, scoretakingToken: event?.target.value })} />
                </FormControl>
                <FormControl>
                    <FormLabel>Current event</FormLabel>
                    <Select placeholder="Select event" _placeholder={{ color: "white" }} value={currentEvent} onChange={(event) => setCurrentEvent(event?.target.value)}>
                        {competition.wcif.events.map((event: Event) => (
                            <option key={event.id} value={event.id}>{events.find((e) => e.id === event.id)?.name}</option>
                        ))}
                    </Select>
                </FormControl>
                {currentEvent && (
                    <FormControl>
                        <FormLabel>Current round</FormLabel>
                        <Select placeholder="Select round" _placeholder={{ color: "white" }} value={currentRound} onChange={(event) => setCurrentRound(event?.target.value)}>
                            {competition.wcif.events.find((event: Event) => event.id === currentEvent)?.rounds.map((round: Round, i: number) => (
                                <option key={round.id} value={round.id}>{i + 1}</option>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {currentRound && (
                    <FormControl>
                        <FormLabel>Current group</FormLabel>
                        <Select placeholder="Select group" _placeholder={{ color: "white" }} value={competition.currentGroupId} onChange={(event) => setCompetition({ ...competition, currentGroupId: event?.target.value })}>
                            {groups.map((group: Activity, i: number) => (
                                <option key={group.activityCode} value={group.activityCode}>{i + 1}</option>
                            ))}
                        </Select>
                    </FormControl>
                )}
                <Button type="submit" colorScheme="green">Save</Button>
            </Box>
        </Box>
    )
};

export default Competition;
