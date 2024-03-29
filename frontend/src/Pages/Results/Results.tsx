import { useCallback, useEffect, useMemo, useState } from "react";
import { Result, Room } from "../../logic/interfaces";
import {
    Box,
    Button,
    Heading,
    IconButton,
    Input,
    Text,
    useToast,
} from "@chakra-ui/react";
import {
    getResultsByRoundId,
    reSubmitRoundToWcaLive,
} from "../../logic/results";
import { getCompetitionInfo } from "../../logic/competition";
import { useNavigate, useParams } from "react-router-dom";
import LoadingPage from "../../Components/LoadingPage";
import EventIcon from "../../Components/Icons/EventIcon";
import { Event, Round } from "@wca/helpers";
import ResultsTable from "../../Components/Table/ResultsTable";
import { resultToString } from "../../logic/resultFormatters";
import {
    getCutoffByRoundId,
    getLimitByRoundId,
    getNumberOfAttemptsForRound,
    getRoundNameById,
} from "../../logic/utils";
import Alert from "../../Components/Alert";
import { getToken, getUserInfo } from "../../logic/auth.ts";
import { HAS_WRITE_ACCESS } from "../../logic/accounts.ts";
import { MdAdd } from "react-icons/md";
import CreateAttemptModal from "../../Components/Modal/CreateAttemptForm.tsx";
import { competitionAtom } from "../../logic/atoms.ts";
import { useAtom } from "jotai";
import { getAllRooms } from "../../logic/rooms.ts";
import io from "socket.io-client";
import { RESULTS_WEBSOCKET_URL, WEBSOCKET_PATH } from "../../logic/request.ts";
import Select from "../../Components/Select.tsx";

const Results = (): JSX.Element => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const filters = {
        eventId: id?.split("-")[0] || "",
        roundId: id || "",
    };
    const toast = useToast();
    const userInfo = getUserInfo();
    const [socket] = useState(
        io(RESULTS_WEBSOCKET_URL, {
            transports: ["websocket"],
            path: WEBSOCKET_PATH,
            closeOnBeforeunload: true,
            auth: {
                token: getToken(),
            },
        })
    );

    const [openConfirmation, setOpenConfirmation] = useState<boolean>(false);
    const [competition, setCompetition] = useAtom(competitionAtom);
    const [results, setResults] = useState<Result[]>([]);
    const [currentRounds, setCurrentRounds] = useState<string[]>([]);

    const [isOpenCreateAttemptModal, setIsOpenCreateAttemptModal] =
        useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const cutoff = useMemo(() => {
        if (!competition) {
            return null;
        }
        return getCutoffByRoundId(filters.roundId, competition.wcif);
    }, [competition, filters.roundId]);
    const limit = useMemo(() => {
        if (!competition) {
            return null;
        }
        return getLimitByRoundId(filters.roundId, competition.wcif);
    }, [competition, filters.roundId]);

    const maxAttempts = useMemo(() => {
        if (!competition) {
            return 0;
        }
        return getNumberOfAttemptsForRound(filters.roundId, competition.wcif);
    }, [competition, filters.roundId]);

    const fetchData = async (roundId: string, search?: string) => {
        const data = await getResultsByRoundId(roundId, search);
        setResults(data);
    };

    const fetchCompetition = useCallback(async () => {
        const response = await getCompetitionInfo();
        if (response.status !== 200) {
            navigate("/competition");
        }
        setCompetition(response.data);
    }, [navigate, setCompetition]);

    const handleEventChange = async (id: string) => {
        const roundId = id + "-r1";
        navigate(`/results/round/${roundId}`);
        await fetchData(roundId);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        fetchData(filters.roundId, event.target.value);
        setSearch(event.target.value);
    };

    const handleResubmitRound = () => {
        setOpenConfirmation(true);
    };

    const handleCancel = () => {
        setOpenConfirmation(false);
    };

    const handleConfirm = async () => {
        setOpenConfirmation(false);
        const status = await reSubmitRoundToWcaLive(filters.roundId);
        if (status === 200) {
            toast({
                title: "Successfully resubmitted round results to WCA Live.",
                status: "success",
                duration: 9000,
                isClosable: true,
            });
        } else {
            toast({
                title: "Error",
                description: "Something went wrong",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        }
    };

    const handleCloseCreateAttemptModal = () => {
        fetchData(filters.roundId);
        setIsOpenCreateAttemptModal(false);
    };

    useEffect(() => {
        if (!competition) {
            fetchCompetition();
        }
    }, [competition, fetchCompetition]);

    useEffect(() => {
        if (filters.roundId) {
            fetchData(filters.roundId);
        } else {
            if (currentRounds.length === 1) {
                navigate(`/results/round/${currentRounds[0]}`);
            }
        }

        socket.emit("join", { roundId: filters.roundId });

        socket.on("resultEntered", () => {
            fetchData(filters.roundId);
        });

        return () => {
            socket.emit("leave", { roundId: filters.roundId });
        };
    }, [currentRounds, filters.roundId, navigate, socket]);

    useEffect(() => {
        getAllRooms().then((rooms: Room[]) => {
            const ids = new Set<string>(
                rooms
                    .filter((room) => room.currentGroupId)
                    .map((room) => room.currentGroupId.split("-g")[0])
            );
            setCurrentRounds([...ids]);
        });
    }, []);

    if (!competition || !results) {
        return <LoadingPage />;
    }

    return (
        <Box display="flex" flexDirection="column" gap="5">
            <Box
                display="flex"
                flexDirection={{ base: "column", md: "row" }}
                gap="5"
            >
                <Box display="flex" flexDirection="row" gap="5">
                    {competition.wcif.events.map((event: Event) => (
                        <IconButton
                            key={event.id}
                            aria-label={event.id}
                            icon={
                                <EventIcon
                                    eventId={event.id}
                                    selected={filters.eventId === event.id}
                                    size={20}
                                />
                            }
                            onClick={() => handleEventChange(event.id)}
                            justifyContent="center"
                            alignItems="center"
                        />
                    ))}
                </Box>
                <Box width={{ base: "100%", md: "5%" }}>
                    <Select
                        value={filters.roundId}
                        onChange={(event) =>
                            navigate(`/results/round/${event.target.value}`)
                        }
                    >
                        {competition.wcif.events
                            .find(
                                (event: Event) => event.id === filters.eventId
                            )
                            ?.rounds.map((round: Round, i: number) => (
                                <option key={round.id} value={round.id}>
                                    {i + 1}
                                </option>
                            ))}
                    </Select>
                </Box>
                <Input
                    placeholder="Search"
                    _placeholder={{ color: "white" }}
                    width={{ base: "100%", md: "20%" }}
                    value={search}
                    onChange={handleSearch}
                />

                {currentRounds.map((roundId) => (
                    <Button
                        key={roundId}
                        colorScheme="blue"
                        onClick={() => {
                            navigate(`/results/round/${roundId}`);
                        }}
                    >
                        {getRoundNameById(roundId, competition.wcif)}
                    </Button>
                ))}
            </Box>
            {filters.roundId && (
                <Box display="flex" flexDirection="column" gap="5">
                    {HAS_WRITE_ACCESS.includes(userInfo.role) && (
                        <IconButton
                            icon={<MdAdd />}
                            aria-label="Add"
                            bg="white"
                            color="black"
                            rounded="20"
                            width="5"
                            height="10"
                            _hover={{
                                background: "white",
                                color: "gray.700",
                            }}
                            onClick={() => setIsOpenCreateAttemptModal(true)}
                        />
                    )}
                    <Text>
                        Cutoff:{" "}
                        {cutoff
                            ? `${resultToString(cutoff.attemptResult)} (${cutoff.numberOfAttempts} attempts)`
                            : "None"}
                    </Text>
                    <Text>
                        Limit:{" "}
                        {limit
                            ? `${resultToString(limit.centiseconds)} ${limit.cumulativeRoundIds.length > 0 ? "(cumulative)" : ""}`
                            : "None"}
                    </Text>
                    <Text>Attempts: {maxAttempts}</Text>
                    {HAS_WRITE_ACCESS.includes(userInfo.role) &&
                        results.length > 0 && (
                            <Button
                                colorScheme="yellow"
                                width={{ base: "100%", md: "20%" }}
                                onClick={handleResubmitRound}
                            >
                                Resubmit round results to WCA Live
                            </Button>
                        )}
                </Box>
            )}
            {results.length > 0 ? (
                <ResultsTable results={results} maxAttempts={maxAttempts} />
            ) : (
                <Heading size="lg">No results found</Heading>
            )}
            <Alert
                isOpen={openConfirmation}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                title="Resubmit results"
                description="Are you sure you want to override results from WCA Live?"
            />
            <CreateAttemptModal
                isOpen={isOpenCreateAttemptModal}
                onClose={handleCloseCreateAttemptModal}
                roundId={filters.roundId}
                timeLimit={limit!}
            />
        </Box>
    );
};

export default Results;
