using System;
using Unity.MLAgents.Actuators;
using UnityEngine;

namespace Unity.MLAgentsExamples
{
    /// <summary>
    /// A simple example of a ActuatorComponent.
    /// This should be added to the same GameObject as the SwallowController
    /// </summary>
    public class SwallowActuatorComponent : ActuatorComponent
    {
        public SwallowController basicController;
        ActionSpec m_ActionSpec = ActionSpec.MakeContinuous(3);

        /// <summary>
        /// Creates a SwallowActuator.
        /// </summary>
        /// <returns>Corresponding actuators.</returns>
        public override IActuator[] CreateActuators()
        {
            return new IActuator[] { new SwallowActuator(basicController) };
        }

        public override ActionSpec ActionSpec
        {
            get { return m_ActionSpec; }
        }
    }

    /// <summary>
    /// Simple actuator that converts the action into a {-1, 0, 1} direction
    /// </summary>
    public class SwallowActuator : IActuator
    {
        public SwallowController basicController;
        ActionSpec m_ActionSpec;
        const float moveSpeed = 0.5f;

        public SwallowActuator(SwallowController controller)
        {
            basicController = controller;
            m_ActionSpec = ActionSpec.MakeContinuous(3);
        }

        public ActionSpec ActionSpec
        {
            get { return m_ActionSpec; }
        }

        /// <inheritdoc/>
        public String Name
        {
            get { return "Swallow"; }
        }

        public void ResetData()
        {

        }

        public void OnActionReceived(ActionBuffers actionBuffers)
        {
            var continuousActions = actionBuffers.ContinuousActions;
            var direction = new Vector3(
                continuousActions[0],
                continuousActions[1],
                continuousActions[2]
            ) * moveSpeed;

            basicController.MoveDirection(direction);
        }

        public void Heuristic(in ActionBuffers actionBuffersOut)
        {
            var continuousActions = actionBuffersOut.ContinuousActions;
            continuousActions[0] = Input.GetAxis("Horizontal");    // X axis
            continuousActions[1] = Input.GetAxis("Vertical");      // Y axis
            continuousActions[2] = Input.GetKey(KeyCode.Q) ? -1f : Input.GetKey(KeyCode.E) ? 1f : 0f;  // Z axis
        }

        public void WriteDiscreteActionMask(IDiscreteActionMask actionMask)
        {

        }

    }
}
